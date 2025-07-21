#!/bin/bash

# Import sample data script for Cydra database
# 
# Usage:
#   Local deployment:  ./import.sh
#   Mainnet deployment: NETWORK=ic ./import.sh
#
# Network configuration
NETWORK=${NETWORK:-local}

# Set dfx command based on network
if [ "$NETWORK" = "ic" ]; then
    DFX_CMD="dfx canister call backend --network ic"
    echo "--- Deploying to Internet Computer mainnet"
else
    DFX_CMD="dfx canister call backend"
    echo "--- Deploying to local network"
fi

echo "--- Creating additional sample tables if not exists"
$DFX_CMD execute 'CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL,
    category TEXT,
    stock INTEGER
)'

$DFX_CMD execute 'CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    customer_name TEXT NOT NULL,
    product_id INTEGER,
    quantity INTEGER,
    order_date TEXT,
    FOREIGN KEY (product_id) REFERENCES products (id)
)'

# Function to generate random product names
generate_product_name() {
  PRODUCTS=("Laptop" "Mouse" "Keyboard" "Monitor" "Phone" "Tablet" "Headphones" "Speaker" "Camera" "Printer" "Router" "Cable" "Charger" "Stand" "Case" "Battery" "Memory" "Drive" "Card" "Adapter")
  echo "${PRODUCTS[$RANDOM % ${#PRODUCTS[@]}]}"
}

# Function to generate random customer names
generate_customer_name() {
  NAMES=("Alice Johnson" "Bob Smith" "Charlie Brown" "David Wilson" "Emma Davis" "Frank Miller" "Grace Lee" "Hannah Taylor" "Ian Clark" "Jack Anderson" "Kathy White" "Leo Harris" "Mia Martin" "Nathan Garcia" "Olivia Rodriguez" "Paul Lewis" "Quinn Walker" "Rachel Hall" "Steve Young" "Tina King")
  echo "${NAMES[$RANDOM % ${#NAMES[@]}]}"
}

# Function to generate random categories
generate_category() {
  CATEGORIES=("Electronics" "Accessories" "Computers" "Mobile" "Audio" "Office")
  echo "${CATEGORIES[$RANDOM % ${#CATEGORIES[@]}]}"
}

BATCH_SIZE=100  # Number of records per batch
TOTAL_PRODUCTS=100
TOTAL_ORDERS=100

echo "--- Inserting $TOTAL_PRODUCTS random products in batches of $BATCH_SIZE"

# Insert products
INSERT_SQL="INSERT INTO products (name, price, category, stock) VALUES"
BATCH=""
for ((i=1; i<=TOTAL_PRODUCTS; i++)); do
  PRODUCT_NAME=$(generate_product_name)
  PRICE=$(echo "scale=2; $((RANDOM % 50000 + 1000)) / 100" | bc)  # Price between 10.00 and 500.00
  CATEGORY=$(generate_category)
  STOCK=$((RANDOM % 100 + 1))  # Stock between 1 and 100

  # Append values to batch
  BATCH+="(\"$PRODUCT_NAME\", $PRICE, \"$CATEGORY\", $STOCK),"

  # Execute batch when we reach BATCH_SIZE
  if (( i % BATCH_SIZE == 0 )); then
    FINAL_SQL="${INSERT_SQL} ${BATCH%,};"  # Remove trailing comma and finalize SQL
    $DFX_CMD execute "$FINAL_SQL"
    BATCH=""  # Reset batch
    echo "Inserted $i products..."
  fi
done

# Insert remaining products if any
if [[ ! -z "$BATCH" ]]; then
  FINAL_SQL="${INSERT_SQL} ${BATCH%,};"
  $DFX_CMD execute "$FINAL_SQL"
  echo "Inserted $TOTAL_PRODUCTS products."
fi

echo "--- Inserting $TOTAL_ORDERS random orders in batches of $BATCH_SIZE"

# Insert orders
INSERT_SQL="INSERT INTO orders (customer_name, product_id, quantity, order_date) VALUES"
BATCH=""
for ((i=1; i<=TOTAL_ORDERS; i++)); do
  CUSTOMER_NAME=$(generate_customer_name)
  PRODUCT_ID=$((RANDOM % TOTAL_PRODUCTS + 1))  # Random product ID
  QUANTITY=$((RANDOM % 5 + 1))  # Quantity between 1 and 5
  ORDER_DATE="2024-$(printf "%02d" $((RANDOM % 12 + 1)))-$(printf "%02d" $((RANDOM % 28 + 1)))"

  # Append values to batch
  BATCH+="(\"$CUSTOMER_NAME\", $PRODUCT_ID, $QUANTITY, \"$ORDER_DATE\"),"

  # Execute batch when we reach BATCH_SIZE
  if (( i % BATCH_SIZE == 0 )); then
    FINAL_SQL="${INSERT_SQL} ${BATCH%,};"  # Remove trailing comma and finalize SQL
    $DFX_CMD execute "$FINAL_SQL"
    BATCH=""  # Reset batch
    echo "Inserted $i orders..."
  fi
done

# Insert remaining orders if any
if [[ ! -z "$BATCH" ]]; then
  FINAL_SQL="${INSERT_SQL} ${BATCH%,};"
  $DFX_CMD execute "$FINAL_SQL"
  echo "Inserted $TOTAL_ORDERS orders."
fi

echo "--- Finished importing sample data"
echo "--- Tables created: products, orders (in addition to existing person table)"
echo "--- Total records: $TOTAL_PRODUCTS products, $TOTAL_ORDERS orders"