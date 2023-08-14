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
  }
  
  { ## UHC seeds ----------------------------------------------------
    
    uhc_api = 'https://github.com/Drexel-UHC/data-science/raw/main/etl/clean' 
    sf_county_seed =  glue("{uhc_api}/boundaries/county.json") %>% topojson_read()
    sf_place_seed =  glue("{uhc_api}/boundaries/place.json") %>% topojson_read()
    curl_download(glue("{uhc_api}/df_demographics.parquet") , "processed/df_demographics.parquet")
    curl_download(glue("{uhc_api}/xwalk_state.parquet") , "processed/xwalk_state.parquet")
    df_demographics = arrow::read_parquet('processed/df_demographics.parquet')
    xwalk_state = arrow::read_parquet('processed/xwalk_state.parquet')
    
  }
  
}


{ # EDA -----------------------------------------------------------
  #' Examine and reproduce original items
  
  { # geo_lad2021.json --------------------------------------------------------
    
    sfa = geojsonio::topojson_read("../public/data/geo_lad2021.json")
    glimpse(sfa)
    sfa %>% geojsonio::topojson_write(
      file = "../public/data/geo_lad2021_uhc.json",
      object_name  = 'geog')
    
  }
  
  { # data_region.csv ------------------------------------------------------------------
    ## region (12)
    
    df_region = read_csv("../public/data/data_region.csv")
    df_region %>% glimpse()
    df_region %>% count(code, name)  
  }
  
  
  { # data_district.csv -------------------------------------------------------
    
    ## district (374)
    df_district = read_csv("../public/data/data_district.csv")
    df_district %>% glimpse()
    df_district %>% count(code, name)
    
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
      mutate(id = geoid) %>% 
      select(id,
             AREACD = geoid,
             AREANM = county_name)
    
    ### Export
    sf_uhc %>% 
      geojsonio::topojson_write(
        file = "../public/data/geo_counties.json",
        object_name  = 'geog')
    
  }
  
  { # data_state.csv ----------------------------------------------------------
    
    df_region %>% glimpse()
    
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
      select(geo, state_fip = geoid, geoid, everything())
    
 
    
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
    df_data_state %>% write_csv("../public/data/data_state.csv")
    
  }
  
  { # data_county.csv ----------------------------------------------------------
    
    df_district %>% glimpse()
    
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
    
    df_age = df_demographics_tmp %>% 
      filter(year == 2020) %>% 
      select(geoid, median_age)
    
    ## Final
    df_data_county = df_pop_wide %>% 
      left_join(df_spatial_metadata) %>% 
      left_join(df_age) %>% 
      select(code = geoid,
             name = county_name,
             parent = state_fip,
             area = aland_mile2,
             density = pop_dens,
             age_med = median_age,
             matches("\\b\\d{4}\\b"))
    
    ## Export
    df_data_county %>% write_csv("../public/data/data_county.csv")
    
  }
  
}

