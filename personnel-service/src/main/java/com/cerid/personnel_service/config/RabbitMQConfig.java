package com.cerid.personnel_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "user-exchange";
    public static final String QUEUE = "user-deleted-queue";
    public static final String ROUTING_KEY = "user.deleted";

    @Bean
    public TopicExchange userExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue userDeletedQueue() {
        return new Queue(QUEUE);
    }

    @Bean
    public Binding binding(Queue userDeletedQueue, TopicExchange userExchange) {
        return BindingBuilder.bind(userDeletedQueue).to(userExchange).with(ROUTING_KEY);
    }
}