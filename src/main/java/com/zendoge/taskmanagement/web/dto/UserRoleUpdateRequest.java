package com.zendoge.taskmanagement.web.dto;

import com.zendoge.taskmanagement.domain.UserRole;
import jakarta.validation.constraints.NotNull;

public record UserRoleUpdateRequest(@NotNull UserRole role) {
}
