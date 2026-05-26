package com.group.mock.entity.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class StatusConverter implements AttributeConverter<Status, Integer> {

    @Override
    public Integer convertToDatabaseColumn(Status status) {
        if (status == null) return null;
        return switch (status) {
            case ACTIVE -> 0;
            case INACTIVE -> 1;
            case BLOCKED -> 2;
        };
    }

    @Override
    public Status convertToEntityAttribute(Integer dbData) {
        if (dbData == null) return null;
        return switch (dbData) {
            case 0 -> Status.ACTIVE;
            case 1 -> Status.INACTIVE;
            case 2 -> Status.BLOCKED;
            default -> throw new IllegalArgumentException("Unknown status value: " + dbData);
        };
    }
}
