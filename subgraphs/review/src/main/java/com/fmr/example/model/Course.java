package com.fmr.example.model;

public class Course {

    private String id;

    public Course() {

    }

    public Course(String id) {
        this.id = id;
    }

    public Course(String id, String name, String category) {
        this.id = id;
    }
    
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
