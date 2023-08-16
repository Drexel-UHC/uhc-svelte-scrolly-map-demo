#' This script will generate the following outputs:
#'   1. county_topo.json (legacy: geo_lad2021.json)
#'   2. data_place.csv (legacy: data_region.csv)
#'   2. data_county.csv (legacy: data_district.csv)

{ # Setup -------------------------------------------------------------------
  
  { # Dependencies ---------------------------------------------------------------
    library(tidyverse)
    library(geojsonio)  
    library(geoarrow)
    library(glue)
    library(curl)  
    library(leaflet)
  }
  
  { ## UHC seeds ----------------------------------------------------
    
    uhc_api = 'https://github.com/Drexel-UHC/data-science/raw/main/etl/clean' 
    sf_county_seed =  glue("{uhc_api}/boundaries/county.json") %>% topojson_read()
    sf_place_seed =  glue("{uhc_api}/boundaries/place.json") %>% topojson_read()
    sf_state_seed =  glue("{uhc_api}/boundaries/state.json") %>% topojson_read()
    curl_download(glue("{uhc_api}/df_demographics.parquet") , "processed/df_demographics.parquet")
    curl_download(glue("{uhc_api}/xwalk_state.parquet") , "processed/xwalk_state.parquet")
    df_demographics = arrow::read_parquet('processed/df_demographics.parquet')
    xwalk_state = arrow::read_parquet('processed/xwalk_state.parquet')
    
  }
  
}




{ # Outputs --------------------------------------------
  
  
  region_tmp = 'Northeast'
  division_tmp =  "Middle Atlantic"
  
  vec__state_abbr = xwalk_state %>% 
    # filter(division_name == division_tmp) %>% 
    filter(region_name == region_tmp) %>% 
    pull(state_abbr)
  
  { ##  county_topo.json ----------------------------------------------------------------
    
    
    ### Op
    ### - select only PA, DE, MD
    ### - rename as per original data structure
    
    sf_init = sf_county_seed %>% 
      left_join(xwalk_state) %>% 
      filter(state_abbr%in%vec__state_abbr)
    
    sf_uhc = sf_init %>%  
      mutate(id = geoid,
             AREACD = geoid,
             AREANM = glue('{county_name}, {state_abbr}')) %>% 
      select(id,
             AREACD,
             AREANM)
    
    ### Export
    sf_uhc %>% 
      geojsonio::topojson_write(
        file = "clean/geo_counties.json",
        object_name  = 'geog')

    
    }
  { ##  state_topo.json ----------------------------------------------------------------
    
    
    ### Op
    ### - select only PA, DE, MD
    ### - rename as per original data structure
    
    sf_init = sf_state_seed %>% 
      left_join(xwalk_state) %>% 
      filter(state_abbr%in%vec__state_abbr)
    
    sf_uhc_state = sf_init %>%  
      mutate(id = geoid,
             AREACD = geoid,
             AREANM = state_name) %>% 
      select(id,
             AREACD,
             AREANM)
    
    ### Export
    sf_uhc_state %>% 
      geojsonio::topojson_write(
        file = "clean/geo_states.json",
        object_name  = 'geog')

  }
  
  { # data_state.csv ----------------------------------------------------------
    
    
    ## Intermediates
    df_demographics_tmp = df_demographics %>% 
      filter(geo == 'state') 
    
    df_pop_wide = df_demographics_tmp %>% 
      select(-median_age) %>% 
      pivot_wider(names_from = year, values_from = pop) %>% 
      drop_na() %>% 
      mutate(`2001` = 0,
             `2002` = 0,
             `2003` = 0,
             `2004` = 0,
             `2005` = 0,
             `2006` = 0,
             `2007` = 0,
             `2008` = 0) %>% 
      select(sort(names(.))) %>% 
      select(geo, state_fip = geoid, geoid,   
             everything()) 
    
    
    
    ## Final
    df_data_state = df_pop_wide %>% 
      left_join(xwalk_state) %>% 
      filter(state_abbr%in%vec__state_abbr) %>%
      select(code = state_fip,
             name = state_name, 
             # area = aland_mile2,
             # density = pop_dens,
             # age_med = median_age,
             matches("\\b\\d{4}\\b"))
    
    ## Export
    df_data_state %>% write_csv("clean/data_state.csv")
    
  }
  
  { # data_county.csv ----------------------------------------------------------
    
    
    ## Intermediates
    xwalk_county_state = sf_county_seed %>%
      as.data.frame() %>% 
      select(geoid, state_fip, county_name) %>% 
      as_tibble()
    
    df_demographics_tmp = df_demographics %>% 
      filter(geo == 'county') %>% 
      left_join(xwalk_county_state) %>% 
      left_join(xwalk_state) %>%
      filter(state_abbr%in%vec__state_abbr) %>%
      glimpse()
    
    df_pop_wide = df_demographics_tmp %>% 
      select(-median_age) %>% 
      pivot_wider(names_from = year, values_from = pop) %>% 
      drop_na() %>% 
      mutate(`2001` = 0,
             `2002` = 0,
             `2003` = 0,
             `2004` = 0,
             `2005` = 0,
             `2006` = 0,
             `2007` = 0,
             `2008` = 0) %>% 
      select(sort(names(.))) %>% 
      select(geo, geoid, everything())
    
    df_spatial_metadata = sf_county_seed %>% 
      as.data.frame() %>% 
      as_tibble() %>% 
      select(geoid, county_name,  aland_mile2,pop_dens) 
    
    ## Age data
    df_age_raw = df_demographics_tmp %>% 
      filter(year == 2020) %>% 
      select(geoid, age_med = median_age)
    pal_age <- colorNumeric(
      palette = "viridis", 
      domain = df_age_raw$age_med   )
    df_age = df_age_raw %>% 
      mutate(color_age_med = pal_age(age_med))
    
    ## Fake salary data
    set.seed(123)
    df_salary_raw = df_demographics_tmp %>% 
      filter(year == 2020) %>% 
      mutate(salary = rnorm(nrow(.),400,30)) %>%
      select(geoid, salary)
    pal_salary <- colorNumeric(
      palette = "plasma", 
      domain = df_salary_raw$salary   )
    df_salary = df_salary_raw %>% 
      mutate(color_salary = pal_salary(salary))
    
    
    ## Final
    df_data_county = df_pop_wide %>% 
      left_join(df_spatial_metadata) %>% 
      left_join(df_age) %>% 
      left_join(df_salary) %>% 
      rowwise() %>% 
      mutate( AREACD = geoid,
             AREANM = glue('{county_name}, {state_abbr}')) %>% 
      ungroup()  %>% 
      select(AREACD, AREANM, contains('salary'), contains('age_med'))
    
      
    
    ## Export
    df_data_county %>% write_csv("clean/data_county.csv")
    df_data_county %>% write_csv("../public/data/data_county.csv")
    
  }
  
}

