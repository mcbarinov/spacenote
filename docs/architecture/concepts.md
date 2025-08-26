# SpaceNote Core Concepts

SpaceNote is a flexible note-taking system where users create custom "spaces" for different purposes (task tracking, journals, catalogs, etc.).

## Core Philosophy

SpaceNote is designed primarily for individuals who need flexible, customizable note organization for their personal notes. It can also serve small teams. Rather than imposing rigid structures, it allows users to define their own data schemas through "spaces" - each tailored to specific use cases.

## Users

Users represent individuals or members of small teams/families using SpaceNote. The system uses simple authentication with username/password and session tokens. Users can be members of multiple spaces and collaborate within shared spaces.

## Spaces

Spaces are customizable containers that define the structure and behavior for notes. Each space acts as an independent schema with:

- **Custom Fields**: Define field types (string, markdown, string_choice, tags, user, datetime, int, float) with validation rules and options
- **Templates**: Optional Liquid templates for customizing note display in list and detail views  
- **Filters**: Predefined query configurations for organizing and viewing notes
- **Members**: Users who have access to create and edit notes within the space
- **Unique Slug**: URL-friendly identifier for space access

Spaces enable users to create specialized note structures like task trackers, journals, catalogs, or any custom use case requiring structured data.

## Field System

Spaces define custom fields with type safety and validation:

- **Field Types**: string, markdown, boolean, string_choice, tags, user, datetime, int, float
- **Field Options**: min/max for numeric fields, predefined values for string_choice fields, allowed values for tags fields
- **Validation**: Required fields, type checking, option constraints
- **Display Control**: Hide fields in create forms, customize list view columns

## Notes

Notes are the core content within spaces. Each note:

- **Belongs to a Space**: Notes exist within a specific space and follow its schema
- **Has Sequential Number**: Gets an auto-incrementing number within its space for URL generation (`/spaces/{slug}/notes/{number}`)
- **Tracks Metadata**: 
  - `author_id`: User who created the note
  - `created_at`: Creation timestamp
  - `edited_at`: Last edit timestamp (null if never edited)
- **Contains Fields**: Values for the custom fields defined in its space
- **Supports Comments**: Users can comment on notes for discussion

## Sequential Numbering

SpaceNote uses an atomic counter system to provide sequential numbering:

- **Note Numbers**: Each note gets a sequential number within its space (1, 2, 3...)
- **URL Generation**: Numbers are used in URLs for stable, human-readable paths
- **Atomic Operations**: Counters ensure no duplicate numbers even under concurrent access
- **Per-Space Isolation**: Each space maintains its own independent counter

## Comments

Comments enable discussion and collaboration on notes:

- **Note-Linked**: Each comment belongs to a specific note
- **Sequential Numbering**: Comments get sequential numbers within their note
- **Author Tracking**: Records who wrote each comment and when
- **Threading Support**: Infrastructure for future threaded discussions (parent_id field)
- **Rich Content**: Comments support markdown formatting

## Authentication & Sessions

SpaceNote uses token-based authentication:

- **Simple Login**: Username and password authentication
- **Session Tokens**: Secure random tokens generated on login
- **Token Storage**: Sessions stored in database with user reference
- **Session TTL**: Tokens valid for 30 days from creation
- **Stateless Auth**: Each request includes token in header or cookie

## Filters

Filters provide a query system for organizing notes within spaces:

- **Conditions**: Field-based filtering with operators (eq, ne, contains, startswith, endswith, in, nin, all, gt, gte, lt, lte)
- **Sorting**: Multi-field sorting with ascending/descending order
- **Display**: Custom column selection for filtered views
- **Presets**: Named filter configurations for common use cases

