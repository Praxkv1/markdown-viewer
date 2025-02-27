# 🔹 Python String Operations: Subsequence vs Substring  

---
## Subsequences

### Two-Pointer Approach to Check Subsequences  

The following function checks if `s2` is a **subsequence** of `s1` using the **two-pointer** technique.  

#### ✅ Code Implementation  
```python
def is_subsequence(s1: str, s2: str) -> bool:
    """Returns True if s2 is a subsequence of s1."""
    i, j = 0, 0  # i for s1, j for s2
    
    while i < len(s1) and j < len(s2):
        if s1[i] == s2[j]:  # If characters match, move j forward
            j += 1
        i += 1  # Always move i forward
    
    return j == len(s2)  # If j reached end of s2, it's a subsequence

# Example Usage:
print(is_subsequence("axbycz", "abc"))  # Output: True
print(is_subsequence("axbycz", "acb"))  # Output: False
```

---
## Substring
### Sliding Window Approach to Check Substrings  

The **Sliding Window** technique is an efficient way to check if `s2` is a **substring** of `s1`.  

### ✅ Code Implementation  
```python
def isSubstring(s1: str, s2: str) -> bool:
    m, n = len(s1), len(s2)

    if n > m:  # If s2 is longer, it can't be a substring
        return False

    for i in range(m - n + 1):  # Slide window of size len(s2) over s1
        if s1[i:i + n] == s2:  # Check if substring matches
            return True

    return False

# Example Usage:
print(isSubstring("hello world", "world"))  # Output: True
print(isSubstring("abcdef", "def"))        # Output: True
print(isSubstring("abcdef", "gh"))         # Output: False
```

---

### 4️⃣ Built-in Methods to Check if a String is a Substring  

Python provides **optimized built-in functions** for checking substrings.  

#### 🔹 Using the `in` Operator (Most Efficient)  
```python
def is_substring(s1: str, s2: str) -> bool:
    """Returns True if s2 is a substring of s1."""
    return s2 in s1  # Python's optimized substring search

# Example Usage:
print(is_substring("hello world", "world"))  # Output: True
print(is_substring("hello world", "python")) # Output: False
```

#### 🔹 Using the `find()` Method  
The `find()` method returns the **index of the first occurrence** (or `-1` if not found).  
```python
def is_substring(s1: str, s2: str) -> bool:
    """Returns True if s2 is a substring of s1."""
    return s1.find(s2) != -1

# Example Usage:
print(is_substring("hello world", "world"))  # Output: True
print(is_substring("hello world", "python")) # Output: False
```
