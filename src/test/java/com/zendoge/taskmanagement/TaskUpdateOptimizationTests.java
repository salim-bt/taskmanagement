package com.zendoge.taskmanagement;

import com.zendoge.taskmanagement.domain.Task;
import com.zendoge.taskmanagement.domain.TaskStatus;
import com.zendoge.taskmanagement.domain.User;
import com.zendoge.taskmanagement.domain.UserRole;
import com.zendoge.taskmanagement.repository.AuditLogRepository;
import com.zendoge.taskmanagement.repository.TaskRepository;
import com.zendoge.taskmanagement.repository.UserRepository;
import com.zendoge.taskmanagement.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskUpdateOptimizationTests {
	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TaskRepository taskRepository;

	@Autowired
	private AuditLogRepository auditLogRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private JwtService jwtService;

	@Autowired
	private UserDetailsService userDetailsService;

	private User adminUser;
	private Task testTask;

	@BeforeEach
	void setUp() {
		auditLogRepository.deleteAll();
		taskRepository.deleteAll();
		userRepository.deleteAll();

		adminUser = createUser("admin@example.com", UserRole.ADMIN);

		Task task = new Task();
		task.setTitle("Original Title");
		task.setDescription("Original Description");
		task.setStatus(TaskStatus.TODO);
		task.setCreatedBy(adminUser);
		testTask = taskRepository.save(task);
		
		// Clear audit logs created during setup (if any)
		auditLogRepository.deleteAll();
	}

	@Test
	void noAuditLogWhenUpdatingWithSameValues() throws Exception {
		String token = tokenFor(adminUser.getEmail());

		// Update with same values
		mockMvc.perform(put("/api/tasks/{id}", testTask.getId())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"Original Title\",\"description\":\"Original Description\",\"status\":\"TODO\"}"))
			.andExpect(status().isOk());

		assertThat(auditLogRepository.findAll()).isEmpty();
	}

	@Test
	void noAuditLogWhenUpdatingWithEmptyPayload() throws Exception {
		String token = tokenFor(adminUser.getEmail());

		// Update with an empty payload
		mockMvc.perform(put("/api/tasks/{id}", testTask.getId())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
			.andExpect(status().isOk());

		assertThat(auditLogRepository.findAll()).isEmpty();
	}

	@Test
	void auditLogCreatedWhenValueChanges() throws Exception {
		String token = tokenFor(adminUser.getEmail());

		// Update with a changed value
		mockMvc.perform(put("/api/tasks/{id}", testTask.getId())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"New Title\"}"))
			.andExpect(status().isOk());

		assertThat(auditLogRepository.findAll()).hasSize(1);
	}

	@Test
	void auditLogCreatedWhenOnlyOneFieldChanges() throws Exception {
		String token = tokenFor(adminUser.getEmail());

		// Update only title, others same
		mockMvc.perform(put("/api/tasks/{id}", testTask.getId())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"Updated Title\",\"description\":\"Original Description\",\"status\":\"TODO\"}"))
			.andExpect(status().isOk());

		assertThat(auditLogRepository.findAll()).hasSize(1);
	}

	@Test
	void memberNoAuditLogWhenStatusSame() throws Exception {
		User member = createUser("member2@example.com", UserRole.MEMBER);
		testTask.setAssignee(member);
		taskRepository.save(testTask);
		auditLogRepository.deleteAll();

		String token = tokenFor(member.getEmail());

		mockMvc.perform(put("/api/tasks/{id}", testTask.getId())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"status\":\"TODO\"}"))
			.andExpect(status().isOk());

		assertThat(auditLogRepository.findAll()).isEmpty();
	}

	private User createUser(String email, UserRole role) {
		User user = new User();
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode("password123"));
		user.setRole(role);
		return userRepository.save(user);
	}

	private String tokenFor(String email) {
		UserDetails userDetailsServiceResult = userDetailsService.loadUserByUsername(email);
		return jwtService.generateToken(userDetailsServiceResult);
	}
}
