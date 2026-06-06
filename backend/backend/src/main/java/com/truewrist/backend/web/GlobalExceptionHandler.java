package com.truewrist.backend.web;

import com.truewrist.backend.exception.ApiException;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Translates exceptions into a consistent JSON error shape: {@code {error, message}}. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static Map<String, Object> body(String message) {
        Map<String, Object> m = new HashMap<>();
        m.put("error", true);
        m.put("message", message);
        return m;
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(body(ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(body("Email hoặc mật khẩu không đúng."));
    }

    @ExceptionHandler({LockedException.class, DisabledException.class})
    public ResponseEntity<Map<String, Object>> handleLocked(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(body("Tài khoản đã bị khoá. Liên hệ quản trị viên."));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(body("Bạn không có quyền thực hiện thao tác này."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(f -> f.getDefaultMessage())
                .orElse("Dữ liệu không hợp lệ.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body(message));
    }
}
