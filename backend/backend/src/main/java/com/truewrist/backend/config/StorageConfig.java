package com.truewrist.backend.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

/**
 * Builds the {@link MinioClient} and ensures the target bucket exists with a
 * public-read policy (uploaded watch/shop/AR images are served directly to the
 * browser via permanent public URLs). All MinIO calls are skipped when
 * {@code app.storage.enabled=false}.
 */
@Configuration
public class StorageConfig {

    private static final Logger log = LoggerFactory.getLogger(StorageConfig.class);

    private final AppProperties props;

    public StorageConfig(AppProperties props) {
        this.props = props;
    }

    @Bean
    public MinioClient minioClient() {
        AppProperties.Storage s = props.storage();
        return MinioClient.builder()
                .endpoint(s.endpoint())
                .credentials(s.accessKey(), s.secretKey())
                .build();
    }

    /**
     * After startup, create the bucket if missing and grant anonymous read so
     * the frontend can load images by URL. Failures are logged but don't crash
     * the app — uploads will surface a clear error at call time instead.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void initBucket() {
        AppProperties.Storage s = props.storage();
        if (!s.enabled()) {
            log.warn("Object storage disabled (app.storage.enabled=false); image uploads will fail.");
            return;
        }
        try {
            MinioClient client = minioClient();
            boolean exists = client.bucketExists(
                    BucketExistsArgs.builder().bucket(s.bucket()).build());
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder().bucket(s.bucket()).build());
                log.info("Created MinIO bucket '{}'.", s.bucket());
            }
            client.setBucketPolicy(SetBucketPolicyArgs.builder()
                    .bucket(s.bucket())
                    .config(publicReadPolicy(s.bucket()))
                    .build());
            log.info("MinIO storage ready at {} (bucket '{}').", s.endpoint(), s.bucket());
        } catch (Exception e) {
            log.error("MinIO init failed ({}). Uploads will not work until storage is reachable.",
                    e.getMessage());
        }
    }

    /** Anonymous read-only access to all objects in the bucket. */
    private static String publicReadPolicy(String bucket) {
        return """
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Effect": "Allow",
                      "Principal": {"AWS": ["*"]},
                      "Action": ["s3:GetObject"],
                      "Resource": ["arn:aws:s3:::%s/*"]
                    }
                  ]
                }
                """.formatted(bucket);
    }
}
