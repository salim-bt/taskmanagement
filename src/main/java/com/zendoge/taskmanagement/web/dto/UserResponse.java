package com.zendoge.taskmanagement.web.dto;

import com.zendoge.taskmanagement.domain.UserRole;
import java.time.Instant;

public record UserResponse(Long id, String email, UserRole role, Instant createdAt) {
}
