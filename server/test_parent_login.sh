#!/bin/bash

echo "测试家长登录..."
curl -s -X POST http://localhost:3000/api/parent/login \
  -H "Content-Type: application/json" \
  -d '{"email":"parent_test@example.com","password":"Parent@123"}'
