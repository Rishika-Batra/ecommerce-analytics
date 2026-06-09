
    
    

select
    event_id as unique_field,
    count(*) as n_records

from read_csv_auto('../data/raw_web_events.csv')
where event_id is not null
group by event_id
having count(*) > 1


