package com.fmr.example.model;

public class Course {

    private String id;
    private Review review;

    public Course() {

    }

    public Course(String id, Review review) {
        this.id = id;
        this.review = review;
    }

    public Course(String id) {
        this.id = id;
    }

    public Review getReview() {
        return review;
    }

    public void setReview(Review review) {
        this.review = review;
    }
    
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
