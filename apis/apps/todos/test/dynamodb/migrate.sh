#!/bin/bash

echo "waiting ..."
sleep 5
echo "starting migration ..."

aws dynamodb describe-limits --endpoint-url http://dynamodb-local:8000 --region us-east-1
aws dynamodb create-table --cli-input-json file://todo.json --endpoint-url http://dynamodb-local:8000 --region us-east-1
aws dynamodb create-table --table-name "todo-table-empty-1" --cli-input-json file://todo.json --endpoint-url http://dynamodb-local:8000 --region us-east-1
aws dynamodb create-table --table-name "todo-table-empty-2" --cli-input-json file://todo.json --endpoint-url http://dynamodb-local:8000 --region us-east-1
aws dynamodb create-table --table-name "todo-table-empty-3" --cli-input-json file://todo.json --endpoint-url http://dynamodb-local:8000 --region us-east-1

echo "migration complete"
