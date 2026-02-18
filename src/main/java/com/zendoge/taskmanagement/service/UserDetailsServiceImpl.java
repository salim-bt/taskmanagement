package com.zendoge.taskmanagement.service;

import com.zendoge.taskmanagement.domain.User;
import com.zendoge.taskmanagement.repository.UserRepository;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
	private final UserRepository userRepository;

	public UserDetailsServiceImpl(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		User user = userRepository.findByEmail(username)
			.orElseThrow(() -> new UsernameNotFoundException("User not found"));

		String role = "ROLE_" + user.getRole().name();
		return new org.springframework.security.core.userdetails.User(
			user.getEmail(),
			user.getPasswordHash(),
			List.of(new SimpleGrantedAuthority(role))
		);
	}
}
