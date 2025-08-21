2025-08-20
- Initialized data for multiple data points (characters, arcs, chapters, etc)
- Connected TypeOrmModule for postgres connection; added relationships between data to relevant entities (ex. Media for Characters)
- Controllers for REST endpoints, Services for basic Create-Remove-Update-Delete functions, Modules for abstraction (separation of features for easier debugging)
- Added basic data for future features (spoiler checks, tagging, user submissions)
- 
- ChatGPT is really good at getting boiler plate code; however, I need to always be mindful on keeping context concise
- Another thing to note is that I know how to read the code and understand what's being done, but writing new code would be very difficult unless I am following an example (i.e. existing documentation)
- Seperation of data into Model-View-Controller is now feeling useful; it actually makes sense to compartmentalize data (especially when using module/factory paradigm)