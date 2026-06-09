import os
import random
import uuid
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

# Configuration
NUM_CUSTOMERS = 1000
NUM_PRODUCTS = 50
START_DATE = datetime(2025, 1, 1)
END_DATE = datetime(2026, 5, 1)  # 16 months of data

def generate_customers():
    countries = ["USA", "Canada", "UK", "Germany", "France"]
    channels = ["Organic", "Paid Search", "Social Media", "Email", "Referral"]
    genders = ["Male", "Female", "Non-binary"]
    
    customers = []
    for i in range(NUM_CUSTOMERS):
        customer_id = f"C{i+1:04d}"
        # Random join date in the first 12 months
        days_to_add = random.randint(0, 365)
        join_date = START_DATE + timedelta(days=days_to_add)
        
        # Demographic signals
        age = int(np.random.normal(35, 12))
        age = max(18, min(75, age))
        
        country = random.choice(countries)
        channel = random.choice(channels)
        gender = random.choice(genders)
        
        customers.append({
            "customer_id": customer_id,
            "join_date": join_date.strftime("%Y-%m-%d"),
            "age": age,
            "gender": gender,
            "country": country,
            "acquisition_channel": channel
        })
    return pd.DataFrame(customers)

def generate_products():
    categories = {
        "Electronics": [("Laptop", 999.99), ("Headphones", 149.99), ("Smartphone", 799.99), ("Smartwatch", 249.99), ("Bluetooth Speaker", 79.99)],
        "Apparel": [("T-Shirt", 24.99), ("Jeans", 59.99), ("Hoodie", 49.99), ("Sneakers", 89.99), ("Jacket", 119.99)],
        "Home": [("Coffee Maker", 89.99), ("Desk Lamp", 34.99), ("Office Chair", 199.99), ("Blender", 49.99), ("Vacuum Cleaner", 149.99)],
        "Beauty": [("Skincare Set", 45.00), ("Perfume", 75.00), ("Lipstick", 19.99), ("Hair Dryer", 59.99), ("Face Mask", 12.50)],
        "Sports": [("Yoga Mat", 29.99), ("Dumbbells Set", 69.99), ("Water Bottle", 19.99), ("Running Shoes", 99.99), ("Backpack", 49.99)]
    }
    
    products = []
    p_id = 1
    for category, items in categories.items():
        for name, base_price in items:
            product_id = f"P{p_id:03d}"
            # Add variation to make 50 products total
            for variation in range(1, 3):
                prod_name = f"{name} v{variation}"
                price = round(base_price * random.uniform(0.9, 1.2), 2)
                stock = random.randint(10, 500)
                products.append({
                    "product_id": f"P{p_id:03d}",
                    "product_name": prod_name,
                    "category": category,
                    "price": price,
                    "stock_quantity": stock
                })
                p_id += 1
    return pd.DataFrame(products)

def generate_orders_and_events(df_customers, df_products):
    orders = []
    order_items = []
    web_events = []
    
    order_id_counter = 1000
    item_id_counter = 5000
    event_id_counter = 10000
    
    # We will simulate customer behaviors over time
    for _, customer in df_customers.iterrows():
        customer_id = customer["customer_id"]
        join_date = datetime.strptime(customer["join_date"], "%Y-%m-%d")
        
        # Determine customer segment / value behavior to build statistical signals
        # Some customers are high-value, some low, some churn quickly
        age = customer["age"]
        channel = customer["acquisition_channel"]
        country = customer["country"]
        
        # Signal: older customers spend more on average
        value_multiplier = 1.0 + (age - 35) / 50.0
        # Signal: social media/referrals acquire customers who purchase more frequently but might churn faster
        purchase_probability = 0.6 if channel in ["Social Media", "Referral"] else 0.4
        # Signal: paid search acquires high spenders
        if channel == "Paid Search":
            value_multiplier *= 1.3
            
        # Select customer churn behavior
        # Let's say 30% of customers are 'one-time buyers' or 'early churners'
        is_churner = random.random() < 0.35
        # If churner, their active purchase window is only 60 days from join date
        # If not churner, active purchase window extends up to the end date of simulation
        active_days = random.randint(10, 60) if is_churner else (END_DATE - join_date).days
        active_days = max(1, active_days)
        active_end_date = join_date + timedelta(days=active_days)
        
        current_time = join_date
        
        # Create a clickstream session loop
        while current_time < active_end_date and current_time < END_DATE:
            # Time between sessions: 3 to 45 days
            days_to_next_session = random.randint(3, 45)
            current_time += timedelta(days=days_to_next_session, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            
            if current_time >= END_DATE or current_time >= active_end_date:
                break
                
            session_id = str(uuid.uuid4())[:8]
            
            # Simulate views and potential purchase
            num_views = random.randint(1, 8)
            viewed_products = df_products.sample(n=min(num_views, len(df_products)))
            
            # Log Page Views
            session_events = []
            for _, prod in viewed_products.iterrows():
                event_time = current_time + timedelta(minutes=random.randint(1, 15))
                session_events.append({
                    "event_id": f"E{event_id_counter}",
                    "customer_id": customer_id,
                    "session_id": session_id,
                    "event_timestamp": event_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "event_type": "view_item",
                    "product_id": prod["product_id"]
                })
                event_id_counter += 1
            
            # Add to Cart probability
            cart_products = []
            for ev in session_events:
                prod_id = ev["product_id"]
                prod = df_products[df_products["product_id"] == prod_id].iloc[0]
                # High price products have lower cart addition rates
                cart_prob = 0.5 if prod["price"] < 100 else 0.2
                if random.random() < cart_prob:
                    event_time = datetime.strptime(ev["event_timestamp"], "%Y-%m-%d %H:%M:%S") + timedelta(minutes=random.randint(1, 5))
                    web_events.append({
                        "event_id": f"E{event_id_counter}",
                        "customer_id": customer_id,
                        "session_id": session_id,
                        "event_timestamp": event_time.strftime("%Y-%m-%d %H:%M:%S"),
                        "event_type": "add_to_cart",
                        "product_id": prod_id
                    })
                    event_id_counter += 1
                    cart_products.append(prod)
            
            web_events.extend(session_events)
            
            # Order Generation
            if cart_products and random.random() < purchase_probability:
                order_id = f"O{order_id_counter}"
                order_id_counter += 1
                
                order_date = current_time + timedelta(minutes=random.randint(10, 20))
                
                # Create Order Items from Cart
                order_total = 0.0
                items_purchased = []
                for prod in cart_products:
                    # Decide if customer actually purchases this cart item
                    if random.random() < 0.8:
                        qty = random.choices([1, 2, 3], weights=[80, 15, 5])[0]
                        price = prod["price"]
                        item_total = price * qty
                        order_total += item_total
                        
                        order_items.append({
                            "item_id": f"I{item_id_counter}",
                            "order_id": order_id,
                            "product_id": prod["product_id"],
                            "quantity": qty,
                            "price": price
                        })
                        item_id_counter += 1
                        items_purchased.append(prod["product_id"])
                
                if items_purchased:
                    # Order Status signal (some returns, some cancelled, mostly completed)
                    status_choices = ["completed", "returned", "cancelled", "processing"]
                    status_weights = [85, 5, 5, 5]
                    # Churners might experience more returns/cancelled to trigger frustration
                    if is_churner:
                        status_weights = [70, 15, 10, 5]
                    status = random.choices(status_choices, weights=status_weights)[0]
                    
                    orders.append({
                        "order_id": order_id,
                        "customer_id": customer_id,
                        "order_date": order_date.strftime("%Y-%m-%d %H:%M:%S"),
                        "total_amount": round(order_total, 2),
                        "status": status
                    })
                    
                    # Log Purchase Events
                    for prod_id in items_purchased:
                        event_time = order_date + timedelta(seconds=random.randint(5, 30))
                        web_events.append({
                            "event_id": f"E{event_id_counter}",
                            "customer_id": customer_id,
                            "session_id": session_id,
                            "event_timestamp": event_time.strftime("%Y-%m-%d %H:%M:%S"),
                            "event_type": "purchase",
                            "product_id": prod_id
                        })
                        event_id_counter += 1
                        
    return pd.DataFrame(orders), pd.DataFrame(order_items), pd.DataFrame(web_events)

def main():
    print("Generating Ecommerce synthetic data...")
    df_customers = generate_customers()
    df_products = generate_products()
    df_orders, df_order_items, df_web_events = generate_orders_and_events(df_customers, df_products)
    
    # Save to data directory
    data_dir = "ecommerce_analytics/data"
    os.makedirs(data_dir, exist_ok=True)
    
    df_customers.to_csv(os.path.join(data_dir, "raw_customers.csv"), index=False)
    df_products.to_csv(os.path.join(data_dir, "raw_products.csv"), index=False)
    df_orders.to_csv(os.path.join(data_dir, "raw_orders.csv"), index=False)
    df_order_items.to_csv(os.path.join(data_dir, "raw_order_items.csv"), index=False)
    df_web_events.to_csv(os.path.join(data_dir, "raw_web_events.csv"), index=False)
    
    print(f"Data generation complete! Saved files to {data_dir}:")
    print(f"- Customers: {len(df_customers)} records")
    print(f"- Products: {len(df_products)} records")
    print(f"- Orders: {len(df_orders)} records")
    print(f"- Order Items: {len(df_order_items)} records")
    print(f"- Web Events: {len(df_web_events)} records")

if __name__ == "__main__":
    main()
