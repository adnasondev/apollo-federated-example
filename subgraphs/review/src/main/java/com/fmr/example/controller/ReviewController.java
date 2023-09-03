package com.fmr.example.controller;

import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import com.fmr.example.model.Course;
import com.fmr.example.model.Review;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Controller
public class ReviewController {

  private final Map<String, List<Review>> reviews = Map.of(
    "1", List.of(new Review("1020", "I recommend ", 2), new Review("1021", "Got me to the next level!", 3)),
    "2", List.of(new Review("1030", "", 3)),
    "3", List.of(new Review("1050", "Amazing place to invest! Would use again and again !", 3), new Review("1051", "", 3))
  );

  @SchemaMapping
  public List<Review> reviews(Course course) {
    return reviews.getOrDefault(course.getId(), Collections.emptyList());
  }
}