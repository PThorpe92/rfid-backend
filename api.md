

|   Resident      |  Timestamp    |     Location      |         | Column4    | Column5    |
|---------------- | --------------- | --------------- | --------------- | --------------- |
| Item1.1    | Item2.1    | Item3.1    | Item4.1    | Item5.1   |



## CONFIGURE 
=================
1. Add location to facility    -> POST /api/locations

2. Edit location               -> PATCH /api/locations/{id}

3. Add Resident to facility    -> POST /api/residents

4. Edit Resident Info          -> PATCH /api/residents/{id}

5. Generate Report             -> ?????


## REPORT
=================
Select by:

 - 1. Resident  -> date range  -> GET /api/residents/{id}/timestamps ****** NEW ******

 - 2. Location
