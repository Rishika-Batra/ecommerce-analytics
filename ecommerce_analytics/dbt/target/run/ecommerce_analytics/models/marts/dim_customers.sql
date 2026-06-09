
  
    
    

    create  table
      "ecommerce"."main"."dim_customers__dbt_tmp"
  
    as (
      with customers as (
    select * from "ecommerce"."main"."stg_customers"
),
orders as (
    select * from "ecommerce"."main"."stg_orders"
    where status = 'completed'
),
web_events as (
    select * from "ecommerce"."main"."stg_web_events"
),
customer_orders as (
    select
        customer_id,
        count(distinct order_id) as total_orders,
        sum(total_amount) as total_spend,
        min(order_date) as first_order_date,
        max(order_date) as last_order_date
    from orders
    group by 1
),
customer_web as (
    select
        customer_id,
        count(distinct session_id) as total_sessions,
        count(case when event_type = 'view_item' then 1 end) as total_page_views,
        count(case when event_type = 'add_to_cart' then 1 end) as total_cart_additions
    from web_events
    group by 1
),
max_dataset_date as (
    select max(order_date) as max_date from orders
)

select
    c.customer_id,
    c.join_date,
    c.age,
    c.gender,
    c.country,
    c.acquisition_channel,
    coalesce(co.total_orders, 0) as total_orders,
    coalesce(co.total_spend, 0.0) as total_spend,
    case 
        when coalesce(co.total_orders, 0) > 0 then round(co.total_spend / co.total_orders, 2)
        else 0.0 
    end as average_order_value,
    co.first_order_date,
    co.last_order_date,
    coalesce(
        date_diff('day', co.last_order_date, (select max_date from max_dataset_date)), 
        date_diff('day', cast(c.join_date as timestamp), (select max_date from max_dataset_date))
    ) as recency_days,
    coalesce(cw.total_sessions, 0) as total_sessions,
    coalesce(cw.total_page_views, 0) as total_page_views,
    coalesce(cw.total_cart_additions, 0) as total_cart_additions,
    case 
        when coalesce(date_diff('day', co.last_order_date, (select max_date from max_dataset_date)), 999) > 45 then 1 
        else 0 
    end as is_churned
from customers c
left join customer_orders co on c.customer_id = co.customer_id
left join customer_web cw on c.customer_id = cw.customer_id
    );
  
  