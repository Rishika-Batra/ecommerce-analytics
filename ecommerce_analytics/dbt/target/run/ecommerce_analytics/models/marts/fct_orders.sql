
  
    
    

    create  table
      "ecommerce"."main"."fct_orders__dbt_tmp"
  
    as (
      with orders as (
    select * from "ecommerce"."main"."stg_orders"
),
order_items as (
    select * from "ecommerce"."main"."stg_order_items"
),
products as (
    select * from "ecommerce"."main"."stg_products"
)

select
    oi.item_id,
    o.order_id,
    o.customer_id,
    o.order_date,
    o.status,
    oi.product_id,
    p.product_name,
    p.category as product_category,
    oi.quantity,
    oi.price as unit_price,
    (oi.quantity * oi.price) as item_revenue
from order_items oi
join orders o on oi.order_id = o.order_id
join products p on oi.product_id = p.product_id
    );
  
  