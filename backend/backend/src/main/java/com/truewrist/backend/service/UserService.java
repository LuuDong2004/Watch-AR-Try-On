package com.truewrist.backend.service;

import com.truewrist.backend.domain.AuthProvider;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.domain.UserStatus;
import com.truewrist.backend.dto.UserDtos.UserCreateRequest;
import com.truewrist.backend.dto.UserDtos.UserUpdateRequest;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.UserRepository;
import com.truewrist.backend.util.Ids;
import java.util.Comparator;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> findAll() {
        List<User> users = userRepository.findAll();
        users.sort(Comparator.comparingLong(User::getCreatedAt).reversed());
        return users;
    }

    public User findById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy người dùng."));
    }

    @Transactional
    public User create(UserCreateRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw ApiException.conflict("Email đã được sử dụng.");
        }
        User user = User.builder()
                .id(Ids.generate("u"))
                .name(req.name())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(req.role())
                .shopId(req.shopId())
                .status(req.status() != null ? req.status() : UserStatus.ACTIVE)
                .provider(AuthProvider.LOCAL)
                .createdAt(System.currentTimeMillis())
                .build();
        return userRepository.save(user);
    }

    @Transactional
    public User update(String id, UserUpdateRequest req) {
        User user = findById(id);
        if (req.name() != null) {
            user.setName(req.name());
        }
        if (req.email() != null && !req.email().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(req.email())) {
                throw ApiException.conflict("Email đã được sử dụng.");
            }
            user.setEmail(req.email());
        }
        if (req.password() != null && !req.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        if (req.role() != null) {
            user.setRole(req.role());
        }
        if (req.shopId() != null) {
            // Empty string clears the assignment.
            user.setShopId(req.shopId().isBlank() ? null : req.shopId());
        }
        if (req.status() != null) {
            user.setStatus(req.status());
        }
        return userRepository.save(user);
    }

    @Transactional
    public void delete(String id) {
        User user = findById(id);
        userRepository.delete(user);
    }
}
