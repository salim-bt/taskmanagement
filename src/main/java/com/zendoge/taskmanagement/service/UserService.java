package com.zendoge.taskmanagement.service;

import com.zendoge.taskmanagement.domain.User;
import com.zendoge.taskmanagement.domain.UserRole;
import com.zendoge.taskmanagement.repository.UserRepository;
import com.zendoge.taskmanagement.web.dto.UserResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {
	private final UserRepository userRepository;

	public UserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	public UserResponse getCurrentUser() {
		String email = currentEmail();
		User user = userRepository.findByEmail(email)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		return toResponse(user);
	}

	public List<UserResponse> getAllUsers() {
		return userRepository.findAll().stream().map(this::toResponse).toList();
	}

	public UserResponse updateUserRole(Long userId, UserRole role) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		user.setRole(role);
		return toResponse(userRepository.save(user));
	}

	private String currentEmail() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || authentication.getName() == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authenticated user");
		}
		return authentication.getName();
	}

	private UserResponse toResponse(User user) {
		return new UserResponse(
			user.getId(),
			user.getEmail(),
			user.getRole(),
			user.getCreatedAt()
		);
	}
}
