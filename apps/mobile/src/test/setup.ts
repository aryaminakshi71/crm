/**
 * Test Setup for Mobile App
 */

import { beforeEach, vi } from "vitest";

// Mock expo modules
vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock("expo-linking", () => ({
  createURL: vi.fn(),
  openURL: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

vi.mock("expo-web-browser", () => ({
  openBrowserAsync: vi.fn(),
  dismissBrowser: vi.fn(),
}));

// Mock react-native reanimated
vi.mock("react-native-reanimated", () => ({
  default: {
    call: () => {},
  },
}));

// Mock @react-navigation/native
vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: vi.fn(),
    goBack: vi.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  vi.clearAllMocks();
});
