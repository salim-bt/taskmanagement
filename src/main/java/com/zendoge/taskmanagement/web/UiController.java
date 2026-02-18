package com.zendoge.taskmanagement.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/ui")
public class UiController {
	@GetMapping
	public String index() {
		return "index";
	}

	@GetMapping("/login")
	public String login() {
		return "login";
	}

	@GetMapping("/tasks")
	public String tasks() {
		return "tasks";
	}

	@GetMapping("/users")
	public String users() {
		return "users";
	}

	@GetMapping("/audit")
	public String audit() {
		return "audit";
	}
}
