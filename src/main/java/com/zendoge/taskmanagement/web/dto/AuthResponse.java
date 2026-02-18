package com.zendoge.taskmanagement.web.dto;

public record AuthResponse(String token, String tokenType) {
	public AuthResponse(String token) {
		this(token, "Bearer");
	}
}
