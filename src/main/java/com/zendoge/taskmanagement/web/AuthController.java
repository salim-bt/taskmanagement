package com.zendoge.taskmanagement.web;

import com.zendoge.taskmanagement.service.AuthService;
import com.zendoge.taskmanagement.web.dto.AuthResponse;
import com.zendoge.taskmanagement.web.dto.LoginRequest;
import com.zendoge.taskmanagement.web.dto.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User registration and login")
public class AuthController {
	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Register a new user", description = "Creates a new user account with MEMBER role and returns a JWT token")
	@ApiResponse(responseCode = "201", description = "User registered successfully")
	@ApiResponse(responseCode = "400", description = "Invalid input or email already exists")
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	@Operation(summary = "Login", description = "Authenticates a user and returns a JWT token")
	@ApiResponse(responseCode = "200", description = "Login successful")
	@ApiResponse(responseCode = "401", description = "Invalid credentials")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}
}
