package com.zendoge.taskmanagement.service;

import com.zendoge.taskmanagement.domain.User;
import com.zendoge.taskmanagement.domain.UserRole;
import com.zendoge.taskmanagement.repository.UserRepository;
import com.zendoge.taskmanagement.security.JwtService;
import com.zendoge.taskmanagement.web.dto.AuthResponse;
import com.zendoge.taskmanagement.web.dto.LoginRequest;
import com.zendoge.taskmanagement.web.dto.RegisterRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;

	public AuthService(
		UserRepository userRepository,
		PasswordEncoder passwordEncoder,
		AuthenticationManager authenticationManager,
		JwtService jwtService
	) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
	}

	public AuthResponse register(RegisterRequest request) {
		if (userRepository.findByEmail(request.email()).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
		}

		User user = new User();
		user.setEmail(request.email());
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user.setRole(UserRole.MEMBER);

		userRepository.save(user);
		String token = jwtService.generateToken(
			new org.springframework.security.core.userdetails.User(
				user.getEmail(),
				user.getPasswordHash(),
				java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
			)
		);
		return new AuthResponse(token);
	}

	public AuthResponse login(LoginRequest request) {
		Authentication authentication = authenticationManager.authenticate(
			new UsernamePasswordAuthenticationToken(request.email(), request.password())
		);
		String token = jwtService.generateToken((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal());
		return new AuthResponse(token);
	}
}
