import bcrypt

# Generate hash for password "admin123"
password = "admin123"
salt = bcrypt.gensalt(rounds=12)
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
print(f"Password: {password}")
print(f"Hash: {hashed.decode('utf-8')}")

# Test verification
test_password = "admin123"
is_valid = bcrypt.checkpw(test_password.encode('utf-8'), hashed)
print(f"Verification test: {is_valid}")
