# SpaceNote Core Concepts

SpaceNote is a flexible note-taking system where users create custom "spaces" for different purposes (task tracking, journals, catalogs, etc.).

## Core Philosophy

SpaceNote is designed primarily for individuals who need flexible, customizable note organization for their personal notes. It can also serve small teams. Rather than imposing rigid structures, it allows users to define their own data schemas through "spaces" - each tailored to specific use cases.

## Users

Users represent individuals or members of small teams/families using SpaceNote. The system uses simple authentication with username/password and session tokens. Users can be members of multiple spaces and collaborate within shared spaces.

## Spaces

Spaces are customizable containers that define the structure and behavior for notes. Each space acts as an independent schema with:

- **Custom Fields**: Define field types (string, markdown, choice, tags, user, datetime, int, float) with validation rules and options
- **Templates**: Optional Liquid templates for customizing note display in list and detail views  
- **Filters**: Predefined query configurations for organizing and viewing notes
- **Members**: Users who have access to create and edit notes within the space
- **Unique Slug**: URL-friendly identifier for space access

Spaces enable users to create specialized note structures like task trackers, journals, catalogs, or any custom use case requiring structured data.

## Field System

Spaces define custom fields with type safety and validation:

- **Field Types**: string, markdown, boolean, choice, tags, user, datetime, int, float
- **Field Options**: min/max for numeric fields, predefined values for choice fields
- **Validation**: Required fields, type checking, option constraints
- **Display Control**: Hide fields in create forms, customize list view columns

## Filters

Filters provide a query system for organizing notes within spaces:

- **Conditions**: Field-based filtering with operators (eq, contains, gt, in, etc.)
- **Sorting**: Multi-field sorting with ascending/descending order
- **Display**: Custom column selection for filtered views
- **Presets**: Named filter configurations for common use cases

