with events as (
    select * from "ecommerce"."main"."stg_web_events"
)

select
    count(case when event_type = 'view_item' then 1 end) as total_views,
    count(case when event_type = 'add_to_cart' then 1 end) as total_cart_additions,
    count(case when event_type = 'purchase' then 1 end) as total_purchases
from events