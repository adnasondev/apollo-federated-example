package com.fmr.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableAutoConfiguration
public class ReviewApplication {
	public static void main(String[] args) {
		SpringApplication.run(ReviewApplication.class, args);
	}
}
