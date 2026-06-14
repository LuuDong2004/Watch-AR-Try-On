package com.truewrist.backend.service;

import com.truewrist.backend.config.AppProperties;
import com.truewrist.backend.exception.ApiException;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Stores images in MinIO and returns permanent public URLs. Handles both
 * multipart uploads (watch/shop photos) and base64 data-URL uploads (AR
 * try-on snapshots captured in the browser).
 */
@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    private static final Set<String> ALLOWED_TYPES = Set.of("image/png", "image/jpeg", "image/webp");
    private static final Set<String> ALLOWED_FOLDERS = Set.of("watches", "shops", "ar", "avatars");
    private static final Map<String, String> EXTENSIONS_BY_TYPE = Map.of(
            "image/png", ".png",
            "image/jpeg", ".jpg",
            "image/webp", ".webp");
    private static final long MAX_BYTES = 15L * 1024 * 1024; // 15 MB

    private final MinioClient client;
    private final AppProperties.Storage cfg;

    public StorageService(MinioClient client, AppProperties props) {
        this.client = client;
        this.cfg = props.storage();
    }

    /** Uploads a multipart image into {@code folder/yyyy/MM/dd/} and returns its public URL. */
    public String store(MultipartFile file, String folder) {
        requireEnabled();
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("File rong.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("Anh vuot qua 15MB.");
        }

        byte[] bytes = readBytes(file);
        String contentType = validateImageContentType(file.getContentType(), bytes);
        String object = objectKey(folder, extensionFor(contentType));

        try {
            client.putObject(PutObjectArgs.builder()
                    .bucket(cfg.bucket())
                    .object(object)
                    .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            log.error("MinIO upload failed: {}", e.getMessage());
            throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Luu anh that bai: " + e.getMessage());
        }
        return publicUrl(object);
    }

    /**
     * Decodes a {@code data:image/...;base64,...} URL and stores it. Used for AR
     * try-on captures. Returns the public URL.
     */
    public String storeDataUrl(String dataUrl, String folder) {
        requireEnabled();
        if (dataUrl == null || !dataUrl.startsWith("data:")) {
            throw ApiException.badRequest("Du lieu anh khong hop le.");
        }
        int comma = dataUrl.indexOf(',');
        int semi = dataUrl.indexOf(';');
        if (comma < 0 || semi < 0 || semi > comma) {
            throw ApiException.badRequest("Dinh dang data URL khong hop le.");
        }

        String contentType = dataUrl.substring(5, semi).toLowerCase(Locale.ROOT);
        String metadata = dataUrl.substring(5, comma).toLowerCase(Locale.ROOT);
        if (!metadata.contains(";base64")) {
            throw ApiException.badRequest("Data URL phai dung dinh dang base64.");
        }

        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(dataUrl.substring(comma + 1));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Base64 anh khong hop le.");
        }
        if (bytes.length == 0) {
            throw ApiException.badRequest("File anh dang rong.");
        }
        if (bytes.length > MAX_BYTES) {
            throw ApiException.badRequest("Anh vuot qua 15MB.");
        }

        contentType = validateImageContentType(contentType, bytes);
        String object = objectKey(folder, extensionFor(contentType));

        try {
            client.putObject(PutObjectArgs.builder()
                    .bucket(cfg.bucket())
                    .object(object)
                    .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            log.error("MinIO data-url upload failed: {}", e.getMessage());
            throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Luu anh that bai: " + e.getMessage());
        }
        return publicUrl(object);
    }

    /**
     * Best-effort delete of a previously uploaded object given its public URL.
     * Ignores URLs that don't point at our bucket (e.g. external Unsplash links).
     */
    public void deleteByUrl(String url) {
        if (!isStoredUrl(url)) {
            return;
        }
        String prefix = publicBucketPrefix();
        String object = url.substring(prefix.length());
        int queryIndex = object.indexOf('?');
        if (queryIndex >= 0) {
            object = object.substring(0, queryIndex);
        }
        int hashIndex = object.indexOf('#');
        if (hashIndex >= 0) {
            object = object.substring(0, hashIndex);
        }
        try {
            client.removeObject(RemoveObjectArgs.builder()
                    .bucket(cfg.bucket())
                    .object(object)
                    .build());
        } catch (Exception e) {
            log.warn("MinIO delete failed for {}: {}", object, e.getMessage());
        }
    }

    /** Returns whether a URL points to an object managed by this app's MinIO bucket. */
    public boolean isStoredUrl(String url) {
        return cfg.enabled() && url != null && url.startsWith(publicBucketPrefix());
    }

    private void requireEnabled() {
        if (!cfg.enabled()) {
            throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Luu tru anh chua duoc bat (app.storage.enabled=false).");
        }
    }

    private static String objectKey(String folder, String ext) {
        LocalDate today = LocalDate.now();
        return "%s/%04d/%02d/%02d/%s%s".formatted(
                validateFolder(folder),
                today.getYear(),
                today.getMonthValue(),
                today.getDayOfMonth(),
                UUID.randomUUID().toString().replace("-", ""),
                ext);
    }

    private static String validateFolder(String folder) {
        if (folder == null || folder.isBlank()) {
            return "watches";
        }
        String safeFolder = folder
                .replace('\\', '/')
                .replaceAll("[^a-zA-Z0-9/_-]", "")
                .replaceAll("/+", "/")
                .replaceAll("^/|/$", "");
        if (!ALLOWED_FOLDERS.contains(safeFolder)) {
            throw ApiException.badRequest("Thu muc upload khong hop le.");
        }
        return safeFolder;
    }

    private static String extensionFor(String contentType) {
        return EXTENSIONS_BY_TYPE.getOrDefault(contentType, ".jpg");
    }

    private static byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (Exception e) {
            throw ApiException.badRequest("Khong doc duoc file anh.");
        }
    }

    private static String validateImageContentType(String declaredContentType, byte[] bytes) {
        String declared = normalizeContentType(declaredContentType);
        if (declared == null || !ALLOWED_TYPES.contains(declared)) {
            throw ApiException.badRequest("Chi chap nhan anh JPG, PNG hoac WebP.");
        }

        String detected = detectImageContentType(bytes);
        if (detected == null || !detected.equals(declared)) {
            throw ApiException.badRequest("Noi dung file khong khop dinh dang anh da khai bao.");
        }
        return detected;
    }

    private static String normalizeContentType(String contentType) {
        if (contentType == null) {
            return null;
        }
        String normalized = contentType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
        return "image/jpg".equals(normalized) ? "image/jpeg" : normalized;
    }

    private static String detectImageContentType(byte[] bytes) {
        if (bytes == null || bytes.length < 4) {
            return null;
        }
        if (startsWith(bytes, 0xFF, 0xD8, 0xFF)) {
            return "image/jpeg";
        }
        if (startsWith(bytes, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) {
            return "image/png";
        }
        if (bytes.length >= 12
                && startsWith(bytes, 0x52, 0x49, 0x46, 0x46)
                && bytes[8] == 0x57
                && bytes[9] == 0x45
                && bytes[10] == 0x42
                && bytes[11] == 0x50) {
            return "image/webp";
        }
        return null;
    }

    private static boolean startsWith(byte[] bytes, int... signature) {
        if (bytes.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if ((bytes[i] & 0xFF) != signature[i]) {
                return false;
            }
        }
        return true;
    }

    private String publicUrl(String object) {
        return publicBucketPrefix() + object;
    }

    private String publicBucketPrefix() {
        return cfg.resolvedPublicUrl() + "/" + cfg.bucket() + "/";
    }
}
