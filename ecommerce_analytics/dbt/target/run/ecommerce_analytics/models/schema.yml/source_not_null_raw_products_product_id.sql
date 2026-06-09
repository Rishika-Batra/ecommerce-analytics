
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select product_id
from read_csv_auto('../data/raw_products.csv')
where product_id is null



  
  
      
    ) dbt_internal_test