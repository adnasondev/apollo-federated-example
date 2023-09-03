package com.fmr.example.model;

public class Review {

    private int courseId;
    private String reviewerName;
    private String comment;
    private int rating;

    public Review() {

    }

    public Review(String reviewerName, String comment, int rating) {
        this.reviewerName = reviewerName;
        this.comment = comment;
        this.rating = rating;
    }

    public int getCourseId() {
        return courseId;
    }

    public void setCourseId(int courseId) {
        this.courseId = courseId;
    }

    public String getReviewerName() {
        return reviewerName;
    }

    public void setReviewerName(String reviewerName) {
        this.reviewerName = reviewerName;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
