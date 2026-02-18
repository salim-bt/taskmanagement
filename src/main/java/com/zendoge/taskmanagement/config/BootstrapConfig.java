package com.zendoge.taskmanagement.config;

import com.zendoge.taskmanagement.domain.User;
import com.zendoge.taskmanagement.domain.UserRole;
import com.zendoge.taskmanagement.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class BootstrapConfig {
	@Bean
	@Profile("!test")
	public ApplicationRunner bootstrapUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			ensureUser(userRepository, passwordEncoder, "admin@task.local", UserRole.ADMIN);
			ensureUser(userRepository, passwordEncoder, "manager@task.local", UserRole.MANAGER);
			ensureUser(userRepository, passwordEncoder, "member@task.local", UserRole.MEMBER);
			ensureUser(userRepository, passwordEncoder, "viewer@task.local", UserRole.VIEWER);
		};
	}

	private void ensureUser(
		UserRepository userRepository,
		PasswordEncoder passwordEncoder,
		String email,
		UserRole role
	) {
		if (userRepository.findByEmail(email).isPresent()) {
			return;
		}
		User user = new User();
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode("password123"));
		user.setRole(role);
		userRepository.save(user);
	}
}
