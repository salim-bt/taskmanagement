package com.zendoge.taskmanagement;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zendoge.taskmanagement.domain.Task;
import com.zendoge.taskmanagement.domain.TaskStatus;
import com.zendoge.taskmanagement.domain.User;
import com.zendoge.taskmanagement.domain.UserRole;
import com.zendoge.taskmanagement.repository.AuditLogRepository;
import com.zendoge.taskmanagement.repository.TaskRepository;
import com.zendoge.taskmanagement.repository.UserRepository;
import com.zendoge.taskmanagement.security.JwtService;
import java.util.List;
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
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskManagementIntegrationTests {
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

	@Autowired
	private ObjectMapper objectMapper;

	private User adminUser;
	private User managerUser;
	private User memberUser;
	private User viewerUser;
	private Task memberTask;
	private Task unassignedTask;

	@BeforeEach
	void setUp() {
		auditLogRepository.deleteAll();
		taskRepository.deleteAll();
		userRepository.deleteAll();

		adminUser = createUser("admin@example.com", UserRole.ADMIN);
		managerUser = createUser("manager@example.com", UserRole.MANAGER);
		memberUser = createUser("member@example.com", UserRole.MEMBER);
		viewerUser = createUser("viewer@example.com", UserRole.VIEWER);

		Task task = new Task();
		task.setTitle("Initial Task");
		task.setDescription("Seeded for tests");
		task.setStatus(TaskStatus.TODO);
		task.setCreatedBy(adminUser);
		task.setAssignee(memberUser);
		memberTask = taskRepository.save(task);

		Task openTask = new Task();
		openTask.setTitle("Unassigned Task");
		openTask.setDescription("No assignee");
		openTask.setStatus(TaskStatus.TODO);
		openTask.setCreatedBy(adminUser);
		unassignedTask = taskRepository.save(openTask);
	}

	@Test
	void tasksUiTemplateRenders() throws Exception {
		mockMvc.perform(get("/ui/tasks"))
			.andExpect(status().isOk())
			.andExpect(content().string(containsString("Task")))
			.andExpect(content().string(containsString("id=\"boardGrid\"")));
	}

	@Test
	void memberCanProgressStatusInOrder() throws Exception {
		String token = tokenFor(memberUser.getEmail());

		mockMvc.perform(put("/api/tasks/{id}", memberTask.getId())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"status\":\"DOING\"}"))
			.andExpect(status().isOk());

		mockMvc.perform(put("/api/tasks/{id}", memberTask.getId())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"status\":\"DONE\"}"))
			.andExpect(status().isOk());
	}

	@Test
	void memberCannotSkipStatus() throws Exception {
		String token = tokenFor(memberUser.getEmail());

		mockMvc.perform(put("/api/tasks/{id}", memberTask.getId())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"status\":\"DONE\"}"))
			.andExpect(status().isUnprocessableEntity());
	}

	@Test
	void auditLogRecordedAndAccessibleToMember() throws Exception {
		String token = tokenFor(memberUser.getEmail());

		mockMvc.perform(put("/api/tasks/{id}", memberTask.getId())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"status\":\"DOING\"}"))
			.andExpect(status().isOk());

		assertThat(auditLogRepository.findAll()).hasSize(1);

		String response = mockMvc.perform(get("/api/audit/me")
				.header("Authorization", "Bearer " + token))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString();

		JsonNode root = objectMapper.readTree(response);
		assertThat(root.isArray()).isTrue();
		assertThat(root.size()).isEqualTo(1);

		mockMvc.perform(get("/api/audit")
				.header("Authorization", "Bearer " + token))
			.andExpect(status().isForbidden());
	}

	@Test
	void registerAndLoginWork() throws Exception {
		String payload = "{\"email\":\"newuser@example.com\",\"password\":\"password123\"}";
		String registerResponse = mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content(payload))
			.andExpect(status().isCreated())
			.andReturn()
			.getResponse()
			.getContentAsString();

		JsonNode registerJson = objectMapper.readTree(registerResponse);
		assertThat(registerJson.get("token").asText()).isNotEmpty();

		String loginResponse = mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(payload))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString();

		JsonNode loginJson = objectMapper.readTree(loginResponse);
		assertThat(loginJson.get("token").asText()).isNotEmpty();
	}

	@Test
	void invalidLoginReturnsUnauthorized() throws Exception {
		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"missing@example.com\",\"password\":\"badpass\"}"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void viewerHasReadOnlyAccess() throws Exception {
		String token = tokenFor(viewerUser.getEmail());

		mockMvc.perform(get("/api/tasks")
				.header("Authorization", "Bearer " + token))
			.andExpect(status().isOk());

		mockMvc.perform(post("/api/tasks")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"New Task\"}"))
			.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/tasks/{id}", memberTask.getId())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"status\":\"DOING\"}"))
			.andExpect(status().isForbidden());

		mockMvc.perform(delete("/api/tasks/{id}", memberTask.getId())
				.header("Authorization", "Bearer " + token))
			.andExpect(status().isForbidden());
	}

	@Test
	void viewerCannotAccessAuditLogs() throws Exception {
		String token = tokenFor(viewerUser.getEmail());

		mockMvc.perform(get("/api/audit/me")
				.header("Authorization", "Bearer " + token))
			.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/audit")
				.header("Authorization", "Bearer " + token))
			.andExpect(status().isForbidden());
	}

	@Test
	void managerCanCreateAndUpdateTasks() throws Exception {
		String token = tokenFor(managerUser.getEmail());

		String response = mockMvc.perform(post("/api/tasks")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"Manager Task\"}"))
			.andExpect(status().isCreated())
			.andReturn()
			.getResponse()
			.getContentAsString();

		JsonNode created = objectMapper.readTree(response);
		Long taskId = created.get("id").asLong();

		mockMvc.perform(put("/api/tasks/{id}", taskId)
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"Updated\"}"))
			.andExpect(status().isOk());
	}

	@Test
	void adminCanDeleteTasks() throws Exception {
		String token = tokenFor(adminUser.getEmail());

		mockMvc.perform(delete("/api/tasks/{id}", memberTask.getId())
				.header("Authorization", "Bearer " + token))
			.andExpect(status().isNoContent());
	}

	@Test
	void memberCannotEditFieldsOrUnassignedTask() throws Exception {
		String token = tokenFor(memberUser.getEmail());

		mockMvc.perform(put("/api/tasks/{id}", memberTask.getId())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"Nope\"}"))
			.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/tasks/{id}", unassignedTask.getId())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"status\":\"DOING\"}"))
			.andExpect(status().isForbidden());
	}

	@Test
	void memberTaskListIsFiltered() throws Exception {
		String token = tokenFor(memberUser.getEmail());

		String response = mockMvc.perform(get("/api/tasks")
				.header("Authorization", "Bearer " + token))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString();

		JsonNode root = objectMapper.readTree(response);
		assertThat(root.size()).isEqualTo(1);
		assertThat(root.get(0).get("id").asLong()).isEqualTo(memberTask.getId());
	}

	@Test
	void auditAccessRulesEnforced() throws Exception {
		String memberToken = tokenFor(memberUser.getEmail());
		String adminToken = tokenFor(adminUser.getEmail());

		mockMvc.perform(get("/api/audit")
				.header("Authorization", "Bearer " + memberToken))
			.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/audit")
				.header("Authorization", "Bearer " + adminToken))
			.andExpect(status().isOk());
	}

	@Test
	void missingTokenReturnsUnauthorized() throws Exception {
		mockMvc.perform(get("/api/tasks"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void adminCanUpdateUserRole() throws Exception {
		String adminToken = tokenFor(adminUser.getEmail());

		mockMvc.perform(put("/api/users/{id}/role", memberUser.getId())
				.header("Authorization", "Bearer " + adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"role\":\"MANAGER\"}"))
			.andExpect(status().isOk());

		User updated = userRepository.findById(memberUser.getId()).orElseThrow();
		assertThat(updated.getRole()).isEqualTo(UserRole.MANAGER);
	}

	@Test
	void onlyAdminCanListUsers() throws Exception {
		String adminToken = tokenFor(adminUser.getEmail());
		String managerToken = tokenFor(managerUser.getEmail());
		String memberToken = tokenFor(memberUser.getEmail());

		mockMvc.perform(get("/api/users")
				.header("Authorization", "Bearer " + adminToken))
			.andExpect(status().isOk());

		mockMvc.perform(get("/api/users")
				.header("Authorization", "Bearer " + managerToken))
			.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/users")
				.header("Authorization", "Bearer " + memberToken))
			.andExpect(status().isForbidden());
	}

	@Test
	void managerCanListAssignableUsers() throws Exception {
		String managerToken = tokenFor(managerUser.getEmail());

		String response = mockMvc.perform(get("/api/users/assignable")
				.header("Authorization", "Bearer " + managerToken))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString();

		JsonNode root = objectMapper.readTree(response);
		assertThat(root.isArray()).isTrue();
		assertThat(root.size()).isEqualTo(4);
	}

	@Test
	void memberCannotListAssignableUsers() throws Exception {
		String memberToken = tokenFor(memberUser.getEmail());

		mockMvc.perform(get("/api/users/assignable")
				.header("Authorization", "Bearer " + memberToken))
			.andExpect(status().isForbidden());
	}

	@Test
	void nonAdminCannotUpdateUserRole() throws Exception {
		String memberToken = tokenFor(memberUser.getEmail());

		mockMvc.perform(put("/api/users/{id}/role", memberUser.getId())
				.header("Authorization", "Bearer " + memberToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"role\":\"MANAGER\"}"))
			.andExpect(status().isForbidden());
	}

	private User createUser(String email, UserRole role) {
		User user = new User();
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode("password123"));
		user.setRole(role);
		return userRepository.save(user);
	}

	private String tokenFor(String email) {
		UserDetails userDetails = userDetailsService.loadUserByUsername(email);
		return jwtService.generateToken(userDetails);
	}
}
