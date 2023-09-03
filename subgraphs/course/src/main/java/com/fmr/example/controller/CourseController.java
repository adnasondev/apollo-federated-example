package com.fmr.example.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.jetbrains.annotations.NotNull;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import com.fmr.example.model.Course;

@Controller
public class CourseController {

    private final Map<String, Course> courses = Stream.of(
        new Course("1", "GraphQL", "Technology"),
        new Course("2", "Inonasia-Java", "Places"),
        new Course("3", "Fidelity", "Investments")
    ).collect(Collectors.toMap(Course::getId, course->course));

    @QueryMapping
    public Course course(@NotNull @Argument String id) {
        return courses.get(id);
    }

    @QueryMapping
    public List<Course> courses() {
        return courses.values().stream().toList();
    }
}
