
    
    

select
    product_id as unique_field,
    count(*) as n_records

from read_csv_auto('../data/raw_products.csv')
where product_id is not null
group by product_id
having count(*) > 1


