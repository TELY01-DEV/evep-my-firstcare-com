// Update admin user with correct password hash
db.admin_users.updateOne(
  {email: "admin@evep.com"},
  {
    $set: {
      password_hash: "$2b$12$fP/ngX0PhAXmGcKP2O5N5.jh8Hext3IpKjzfIpGeNY5gY7VwpsA2a",
      updated_at: new Date()
    }
  }
);

print("Admin user updated successfully!");
