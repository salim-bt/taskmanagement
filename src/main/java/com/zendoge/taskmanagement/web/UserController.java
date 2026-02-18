package com.zendoge.taskmanagement.web;

import com.zendoge.taskmanagement.service.UserService;
import com.zendoge.taskmanagement.web.dto.UserResponse;
import com.zendoge.taskmanagement.web.dto.UserRoleUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "User management and profile operations")
public class UserController {
	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping("/me")
	@Operation(summary = "Get current user", description = "Returns the profile of the currently authenticated user")
	@ApiResponse(responseCode = "200", description = "User profile retrieved")
	public UserResponse me() {
		return userService.getCurrentUser();
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "List all users", description = "Returns all registered users. Requires ADMIN role.")
	@ApiResponse(responseCode = "200", description = "Users retrieved successfully")
	@ApiResponse(responseCode = "403", description = "Insufficient permissions")
	public List<UserResponse> list() {
		return userService.getAllUsers();
	}

	@GetMapping("/assignable")
	@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
	@Operation(summary = "List assignable users", description = "Returns users that can be assigned to tasks. Requires ADMIN or MANAGER role.")
	@ApiResponse(responseCode = "200", description = "Assignable users retrieved")
	@ApiResponse(responseCode = "403", description = "Insufficient permissions")
	public List<UserResponse> assignable() {
		return userService.getAllUsers();
	}

	@PutMapping("/{id}/role")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Update user role", description = "Changes a user's role. Requires ADMIN role.")
	@ApiResponse(responseCode = "200", description = "Role updated successfully")
	@ApiResponse(responseCode = "403", description = "Insufficient permissions")
	@ApiResponse(responseCode = "404", description = "User not found")
	public UserResponse updateRole(
		@Parameter(description = "User ID") @PathVariable Long id,
		@Valid @RequestBody UserRoleUpdateRequest request
	) {
		return userService.updateUserRole(id, request.role());
	}
}
