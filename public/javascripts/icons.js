import { library, dom } from '@fortawesome/fontawesome-svg-core';
import {
    faHome,
    faCapsules,
    faCalendar,
    faChartLine,
    faCog,
    faPlus,
    faCalendarCheck,
    faFileImport,
    faSearch,
    faEnvelope,
    faClock,
    faCloudUploadAlt,
    faCalendarAlt,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

// Add icons to library
library.add(
    faHome,
    faCapsules,
    faCalendar,
    faChartLine,
    faCog,
    faPlus,
    faCalendarCheck,
    faFileImport,
    faSearch,
    faEnvelope,
    faClock,
    faCloudUploadAlt,
    faCalendarAlt,
    faTimes
);

// Replace i elements with svg
dom.watch();