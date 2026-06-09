with orders as (
    select * from {{ ref('stg_orders') }}
    where status = 'completed'
)

select
    cast(order_date as date) as sales_date,
    count(distinct order_id) as total_orders,
    round(sum(total_amount), 2) as daily_revenue,
    round(avg(total_amount), 2) as average_order_value
from orders
group by 1
order by 1
