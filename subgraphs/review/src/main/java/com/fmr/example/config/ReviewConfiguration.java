package com.fmr.example.config;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.apollographql.federation.graphqljava.Federation;
import com.apollographql.federation.graphqljava._Entity;
import com.fmr.example.model.Course;

import graphql.schema.DataFetcher;

import org.springframework.boot.autoconfigure.graphql.GraphQlSourceBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.execution.ClassNameTypeResolver;

@Configuration
public class ReviewConfiguration {

  private static final String SCHEMA_TYPE_NAME = "Course";

  @Bean
  public GraphQlSourceBuilderCustomizer federationTransform() {
    DataFetcher<?> entityDataFetcher = env -> {
      List<Map<String, Object>> representations = env.getArgument(_Entity.argumentName);
      return representations.stream()
        .map(representation -> {
          if (SCHEMA_TYPE_NAME.equals(representation.get("__typename"))) {
            return new Course((String)representation.get("id"));
          }
          return null;
        })
        .collect(Collectors.toList());
    };

    return builder ->
      builder.schemaFactory((registry, wiring)->
        Federation.transform(registry, wiring)
          .fetchEntities(entityDataFetcher)
          .resolveEntityType(new ClassNameTypeResolver())
          .build()
      );
  }
}
