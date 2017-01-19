### CMakeLists automatically created with AutoVala
### Do not edit

set (DATADIR "${CMAKE_INSTALL_PREFIX}/${CMAKE_INSTALL_DATAROOTDIR}")
set (PKGDATADIR "${DATADIR}/libentitas")
set (GETTEXT_PACKAGE "libentitas")
set (RELEASE_NAME "libentitas")
set (CMAKE_C_FLAGS "")
set (PREFIX ${CMAKE_INSTALL_PREFIX})
set (VERSION "0.0.1")
set (TESTSRCDIR "${CMAKE_SOURCE_DIR}")
set (DOLLAR "$")

configure_file (${CMAKE_SOURCE_DIR}/src/Config.vala.cmake ${CMAKE_BINARY_DIR}/src/Config.vala)
add_definitions(-DGETTEXT_PACKAGE=\"${GETTEXT_PACKAGE}\")
configure_file (${CMAKE_CURRENT_SOURCE_DIR}/entitas.pc ${CMAKE_CURRENT_BINARY_DIR}/entitas.pc)
configure_file (${CMAKE_CURRENT_SOURCE_DIR}/entitas.deps ${CMAKE_CURRENT_BINARY_DIR}/entitas.deps)
set (VERSION "0.0.1")
add_definitions (${DEPS_CFLAGS})
link_libraries ( ${DEPS_LIBRARIES} )
link_directories ( ${DEPS_LIBRARY_DIRS} )
find_package (Vala REQUIRED)
include (ValaVersion)
ensure_vala_version ("0.22" MINIMUM)
include (ValaPrecompile)

set (VALA_PACKAGES ${VALA_PACKAGES} gee-0.8)
set (VALA_PACKAGES ${VALA_PACKAGES} glib-2.0)
set (VALA_PACKAGES ${VALA_PACKAGES} gobject-2.0)

set (APP_SOURCES ${APP_SOURCES} ${CMAKE_CURRENT_BINARY_DIR}/Config.vala)
set (APP_SOURCES ${APP_SOURCES} Entity.gs)
set (APP_SOURCES ${APP_SOURCES} Events/ComponentReplaced.gs)
set (APP_SOURCES ${APP_SOURCES} Events/EntityChanged.gs)
set (APP_SOURCES ${APP_SOURCES} Events/EntityReleased.gs)
set (APP_SOURCES ${APP_SOURCES} Events/GroupChanged.gs)
set (APP_SOURCES ${APP_SOURCES} Events/GroupUpdated.gs)
set (APP_SOURCES ${APP_SOURCES} Events/GroupsChanged.gs)
set (APP_SOURCES ${APP_SOURCES} Events/WorldChanged.gs)
set (APP_SOURCES ${APP_SOURCES} Exceptions.gs)
set (APP_SOURCES ${APP_SOURCES} Group.gs)
set (APP_SOURCES ${APP_SOURCES} IEntity.gs)
set (APP_SOURCES ${APP_SOURCES} Interfaces/IComponent.vala)
set (APP_SOURCES ${APP_SOURCES} Interfaces/IMatcher.vala)
set (APP_SOURCES ${APP_SOURCES} Interfaces/ISystem.vala)
set (APP_SOURCES ${APP_SOURCES} Matcher.gs)
set (APP_SOURCES ${APP_SOURCES} Version.gs)
set (APP_SOURCES ${APP_SOURCES} World.gs)
set (APP_SOURCES ${APP_SOURCES} entitas.vala)


if ((${CMAKE_BUILD_TYPE} STREQUAL "Debug") OR (${CMAKE_BUILD_TYPE} STREQUAL "RelWithDebInfo"))
	set(COMPILE_OPTIONS ${COMPILE_OPTIONS} "-g")
endif()

set (COMPILE_OPTIONS ${COMPILE_OPTIONS} --library=entitas --gir entitas-0.0.gir )

vala_precompile(VALA_C entitas
	${APP_SOURCES}
PACKAGES
	${VALA_PACKAGES}
OPTIONS
	${COMPILE_OPTIONS}
GENERATE_VAPI
	entitas
GENERATE_HEADER
	entitas
)

add_library(entitas SHARED ${VALA_C})

set_target_properties( entitas PROPERTIES
VERSION
	0.0.1
SOVERSION
	0 )


install(TARGETS
	entitas
LIBRARY DESTINATION
	${CMAKE_INSTALL_LIBDIR}/
)
install(FILES
	${CMAKE_CURRENT_BINARY_DIR}/entitas.h
DESTINATION
	${CMAKE_INSTALL_INCLUDEDIR}/
)
install(FILES
	${CMAKE_CURRENT_BINARY_DIR}/entitas.vapi
DESTINATION
	${CMAKE_INSTALL_DATAROOTDIR}/vala/vapi/
)
install(FILES
	${CMAKE_CURRENT_BINARY_DIR}/entitas.deps
DESTINATION
	${CMAKE_INSTALL_DATAROOTDIR}/vala/vapi/
)
install(FILES
	${CMAKE_CURRENT_BINARY_DIR}/entitas-0.0.gir
DESTINATION
	${CMAKE_INSTALL_DATAROOTDIR}/gir-1.0/
)
install(FILES
	${CMAKE_CURRENT_BINARY_DIR}/entitas.pc
DESTINATION
	${CMAKE_INSTALL_LIBDIR}/pkgconfig/
)
if(HAVE_VALADOC)
	valadoc(entitas
		${CMAKE_BINARY_DIR}/valadoc/entitas
		${APP_SOURCES}
	PACKAGES
		${VALA_PACKAGES}
	CUSTOM_VAPIS
		${CUSTOM_VAPIS_LIST}
	)
	install(DIRECTORY
		${CMAKE_BINARY_DIR}/valadoc
	DESTINATION
		${CMAKE_INSTALL_DATAROOTDIR}/doc/libentitas
	)
endif()

install(CODE "MESSAGE (\"
************************************************
* Run 'sudo ldconfig' to complete installation *
************************************************

\") " )