# Add Procedure Feature - Trainer's Guide

This guide provides comprehensive training material for instructing users on all features available in the **Add Procedure** dialog. Use this document to train staff on efficiently navigating and utilizing the procedure selection system.

---

## Table of Contents

1. [Opening the Add Procedure Dialog](#1-opening-the-add-procedure-dialog)
2. [Understanding the Interface Layout](#2-understanding-the-interface-layout)
3. [Searching for Procedures](#3-searching-for-procedures)
4. [Using Search Tokens and Filters](#4-using-search-tokens-and-filters)
5. [Navigating Categories and Subcategories](#5-navigating-categories-and-subcategories)
6. [Using Favorites](#6-using-favorites)
7. [Recent Procedures](#7-recent-procedures)
8. [Selecting a Procedure](#8-selecting-a-procedure)
9. [Entering Procedure Field Values](#9-entering-procedure-field-values)
10. [Dialog Options and Settings](#10-dialog-options-and-settings)
11. [Managing Selected Procedures](#11-managing-selected-procedures)
12. [Configuration and Administration](#12-configuration-and-administration)
13. [Quick Reference Card](#13-quick-reference-card)

---

## 1. Opening the Add Procedure Dialog

To open the Add Procedure dialog:

1. Set the **Date** using the date picker (defaults to today's date)
2. Select the **Physician** from the dropdown list
3. Click the **"Add Procedure"** button

> **Tip for Trainers:** Emphasize that the date and physician should be set *before* opening the dialog, as these values will be automatically applied to all procedures added.

---

## 2. Understanding the Interface Layout

The Add Procedure dialog consists of several key areas:

### Header Area
- **Title**: "Select a Procedure" (or procedure name when viewing details)
- **Options**: Toggle checkboxes for Auto-filter, Cat only, Preserve filters, and Keep open
- **Close Button**: X icon to close the dialog

### Search Area
- **Search Box**: Tokenized search input with tag visualization
- **Category Filters**: Collapsible section showing category/subcategory filter buttons
- **Body Part Filters**: Collapsible section showing anatomical tags

### Content Area
- **Favorite Procedures**: Quick access to starred procedures
- **Favorite Categories**: Quick access to starred categories/subcategories
- **Recent Procedures**: Recently used procedures
- **All Procedures**: Full hierarchical list organized by category and subcategory

---

## 3. Searching for Procedures

### Basic Text Search
1. Click in the search box
2. Type any search term (procedure name, category, subcategory, or alias)
3. Results filter in real-time as you type
4. Press **Enter** or **Space** to convert your search term into a token

### Search Behavior
- Search is **case-insensitive**
- Searches match against:
  - Procedure descriptions
  - Category names
  - Subcategory names
  - Procedure aliases (e.g., typing "LP" finds "Lumbar Puncture")
  - Tags/body parts (for terms 3+ characters)

> **Example:** Typing "cardio" will show all procedures in the Cardiovascular category, plus any procedures with "cardio" in their description or tags.

### Clearing the Search
- Click the **X** button on individual tokens to remove them
- Click the **X** button at the end of the search box to clear all filters
- Press **Backspace** when the search input is empty to remove the last token

---

## 4. Using Search Tokens and Filters

Search tokens are color-coded pills that represent active filters:

| Token Type | Color | Label | Description |
|------------|-------|-------|-------------|
| Category | Purple | CAT | Filters to a specific category |
| Subcategory | Cyan | SUB | Filters to a specific subcategory |
| Body Part/Tag | Green | BODY | Filters by anatomical location or tag |
| Text | Gray | (none) | General text search |

### Adding Filter Tokens

**Method 1: Click a Suggestion**
1. Expand "Refine by Category" section (click to toggle)
2. Click any category or subcategory button to add it as a filter

**Method 2: Click a Body Part Tag**
1. Expand "Filter by Body Part" section
2. Click any tag button to filter by that anatomical area

**Method 3: Type and Convert**
1. Type a category, subcategory, or tag name exactly
2. Press **Enter** or **Space** to create a token

### Combining Filters
- Multiple tokens work together (AND logic)
- Example: Adding "Cardiovascular" (CAT) + "chest" (BODY) shows only cardiovascular procedures tagged with "chest"

---

## 5. Navigating Categories and Subcategories

### Hierarchical Structure
Procedures are organized in a two-level hierarchy:
- **Category** (e.g., Cardiovascular, Neurological, Gastrointestinal)
  - **Subcategory** (e.g., Arrhythmia, Stroke, Endoscopy)
    - Individual procedures

### Expanding/Collapsing

**When Multiple Categories Exist:**
- Click the **chevron (>)** or category name to expand/collapse
- Collapsed categories show procedure count in parentheses

**When Single Category or Subcategory:**
- Section is automatically expanded
- No collapse option needed

### Auto-Filter on Expand
When the **"Auto-filter"** option is enabled (checked):
- Expanding a category automatically adds it as a search token
- Expanding a subcategory automatically adds it as a search token
- This helps narrow down the view progressively

> **Trainer Tip:** Demonstrate the difference between having Auto-filter ON vs OFF to show how it affects the workflow.

---

## 6. Using Favorites

Favorites provide quick access to frequently used items. There are three types of favorites:

### Favorite Procedures (Gold Star ★)
- Appear in the "Favorite Procedures" section at the top (when no search is active)
- Shows procedure name with category/subcategory path
- Click to add procedure immediately

**To add/remove a procedure favorite:**
- Hover over any procedure in the list
- Click the **star icon** that appears on the left
- Filled star = favorited, Empty star = not favorited

### Favorite Categories (Purple Badge)
- Appear in the "Favorite Categories" section
- Click to add the category as a search filter
- Useful for users who frequently work with specific categories

**To add/remove a category favorite:**
- Hover over any category header
- Click the **star icon** that appears
- Favorites persist across sessions

### Favorite Subcategories (Cyan Badge)
- Also appear in the "Favorite Categories" section
- Click to add the subcategory as a search filter

**To add/remove a subcategory favorite:**
- Hover over any subcategory header
- Click the **star icon** that appears

### Favorites Display
- Favorites sections are **collapsible** (click the section header)
- Only show when no search filters are active
- Count of favorites shown in section header

---

## 7. Recent Procedures

The **Recent** section displays the last 10 procedures that were selected:

### Location
- Appears below favorites when no search is active
- Shows procedure name with category/subcategory path

### Using Recent Procedures
1. Click the **Recent** section header to expand/collapse
2. Click any procedure to add it again
3. Hover to reveal the star icon for adding to favorites

### Automatic Tracking
- Procedures are added to recents whenever selected
- Duplicates are moved to the top (most recent first)
- Limited to 10 items (oldest removed when limit reached)

> **Trainer Tip:** Point out that Recents + Favorites together can significantly speed up workflow for users who regularly enter the same types of procedures.

---

## 8. Selecting a Procedure

### Quick-Add Procedures (No Fields)
Some procedures have no additional input fields required:
1. Click the procedure name
2. Procedure is **immediately added** to the selected list
3. Dialog closes (unless "Keep open" is checked)

These are marked with **(quick add)** in the list.

### Procedures with Fields
Procedures requiring additional input:
1. Click the procedure name
2. Dialog transitions to a detail view showing:
   - Procedure name in header
   - Input fields or option list
3. Complete the required fields
4. Click **"Add Procedure"** button

---

## 9. Entering Procedure Field Values

### Field Types

**Dropdown List (Single Selection)**
- If procedure has only ONE list field: options display as clickable buttons
- Click any option to immediately add the procedure with that value
- Faster than traditional dropdown selection

**Dropdown List (Multiple Fields)**
- Standard dropdown select box
- Click to see all options
- Select the appropriate value

**Number Input**
- Enter numeric values only
- Used for counts, measurements, etc.

**Text Input**
- Free-form text entry
- Used for notes, specifications, etc.

**Checkbox**
- Click the checkbox or label to toggle
- Used for yes/no options

### Quick Option Selection
When a procedure has a **single dropdown field**:
- Options are displayed as a list of clickable buttons
- Click any option to immediately add the procedure
- Much faster than dropdown + save workflow

### Form Submission
For procedures with multiple fields:
1. Complete all required fields
2. Click the **"Add Procedure"** button at the bottom
3. Procedure is added with all entered values

### Navigating Back
- Click the **back arrow** (←) in the header to return to procedure list
- Press **Escape** key to go back
- Any entered values are discarded if not saved

---

## 10. Dialog Options and Settings

Four toggle options are available in the header:

### Auto-filter
**When checked:**
- Expanding a category adds it as a search filter token
- Expanding a subcategory adds it as a search filter token
- Helps progressively narrow down the procedure list

**When unchecked:**
- Expansion only reveals contents
- No automatic filtering applied

### Cat only (Category Only)
**When checked:**
- Suggestion buttons only show categories until narrowed to one
- Subcategories appear only after selecting a category
- Reduces visual clutter for large procedure lists

**When unchecked:**
- Both categories and subcategories shown in suggestions
- Provides more filtering options upfront

### Preserve filters
**When checked:**
- Search tokens remain when dialog is closed and reopened
- Useful when adding multiple procedures of the same type

**When unchecked:**
- All filters are cleared when dialog closes
- Dialog opens fresh each time

### Keep open
**When checked:**
- Dialog stays open after selecting a procedure
- Perfect for adding multiple procedures quickly
- After selection, returns to procedure list (filters preserved)

**When unchecked:**
- Dialog closes after each procedure selection
- User must click "Add Procedure" again for each item

> **Trainer Tip:** For data entry sessions with multiple procedures, recommend enabling "Keep open" and "Preserve filters" together.

---

## 11. Managing Selected Procedures

After adding procedures, they appear in the **Selected Procedures** table on the main screen:

### Table Columns
| Column | Description |
|--------|-------------|
| Category | The procedure's category |
| Subcategory | The procedure's subcategory |
| Description | The procedure name |
| Date | Date the procedure was performed |
| Physician | Physician who performed it |
| Field Values | Any additional values entered |
| Actions | Edit and Delete buttons |

### Editing a Procedure
1. Click the **pencil icon** (Edit) in the Actions column
2. Modify any of the following:
   - Date
   - Physician
   - Field values (if applicable)
3. Click **"Save Changes"**

### Deleting a Procedure
1. Click the **trash icon** (Delete) in the Actions column
2. Procedure is immediately removed (no confirmation)

### Hovering for Details
- Hover over any row to see the Control Name in a tooltip
- Control names are internal identifiers

---

## 12. Configuration and Administration

Access the Configuration Editor by clicking the **gear icon** (⚙) in the upper right corner of the main screen.

### Import Configuration
1. Click **"Import"** button
2. Select a JSON configuration file
3. Configuration replaces current settings

### Export Configuration
1. Click **"Export"** button
2. JSON file downloads with all current settings
3. Use for backup or sharing configurations

### Publish to GitHub
For organizations using GitHub-based deployment:
1. Click **"Publish"** button
2. Enter GitHub token (saved for future use)
3. Optionally add a commit message
4. Click **"Publish"** to deploy changes

### Reset to Defaults
1. Click **"Reset to Defaults"** button
2. Confirm the action
3. Returns to original configuration

### Managing Procedures
- View all procedures in a searchable list
- Add, edit, or delete procedures
- Configure fields, aliases, and tags

### Managing Categories
- View and edit category definitions
- Adjust sort order
- Add or remove categories

### Managing Subcategories
- View and edit subcategory definitions
- Adjust sort order
- Add or remove subcategories

---

## 13. Quick Reference Card

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Escape | Close dialog or go back to procedure list |
| Enter | Convert typed text to search token |
| Space | Convert typed text to search token |
| Backspace | Remove last token (when search input is empty) |

### Search Token Colors
| Color | Type | Example |
|-------|------|---------|
| Purple | Category | Cardiovascular, Neurological |
| Cyan | Subcategory | Arrhythmia, Endoscopy |
| Green | Body Part/Tag | chest, spine, abdomen |
| Gray | Text | Any free-text search |

### Common Workflows

**Adding Multiple Related Procedures:**
1. Enable "Keep open" ✓
2. Enable "Preserve filters" ✓
3. Search for category once
4. Click procedures to add them
5. Close when done

**Quick Access to Frequent Procedures:**
1. Star your most-used procedures as favorites
2. Star your most-used categories
3. Favorites appear at the top of the dialog

**Narrowing Large Lists:**
1. Enable "Auto-filter" ✓
2. Enable "Cat only" ✓
3. Click category to expand + filter
4. Click subcategory to further narrow
5. Select procedure

### Icons Reference
| Icon | Meaning |
|------|---------|
| ★ (filled gold) | Favorited item |
| ☆ (empty) | Not favorited (hover to show) |
| > (chevron right) | Collapsed section |
| ∨ (chevron down) | Expanded section |
| 🕐 (clock) | Recent procedures section |
| ← (back arrow) | Return to procedure list |
| ✕ (X) | Close/remove |

---

## Training Checklist

Use this checklist when training new users:

- [ ] Open the Add Procedure dialog
- [ ] Demonstrate basic text search
- [ ] Show how search tokens work (add/remove)
- [ ] Expand and collapse category sections
- [ ] Toggle Auto-filter ON/OFF to show difference
- [ ] Add a procedure to favorites
- [ ] Add a category to favorites
- [ ] Select a quick-add procedure
- [ ] Select a procedure with single list field
- [ ] Select a procedure with multiple fields
- [ ] Enable Keep open and add multiple procedures
- [ ] Edit a selected procedure
- [ ] Delete a selected procedure
- [ ] Access the Configuration editor (admin users only)

---

*Document Version: 1.0*  
*Last Updated: December 2024*
