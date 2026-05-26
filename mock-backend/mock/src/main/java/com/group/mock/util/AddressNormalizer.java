package com.group.mock.util;

import java.text.Normalizer;
import java.util.regex.Pattern;

/**
 * Utility class to normalize addresses for comparison and duplicate detection.
 * Handles: trimming, lowercasing, removing extra whitespace, removing punctuation, and removing accents.
 */
public class AddressNormalizer {
    private static final Pattern EXTRA_WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern PUNCTUATION = Pattern.compile("[^\\p{L}\\p{N}\\s]");

    /**
     * Normalize an address string for comparison.
     * Process: trim -> lowercase -> collapse whitespace -> remove punctuation -> remove accents
     *
     * @param address the address to normalize
     * @return normalized address
     */
    public static String normalize(String address) {
        if (address == null || address.isEmpty()) {
            return "";
        }

        // Step 1: Trim and lowercase
        String result = address.trim().toLowerCase();

        // Step 2: Collapse extra whitespace
        result = EXTRA_WHITESPACE.matcher(result).replaceAll(" ");

        // Step 3: Remove punctuation
        result = PUNCTUATION.matcher(result).replaceAll("");

        // Step 4: Remove accents (Vietnamese: á -> a, ế -> e, etc.)
        result = removeAccents(result);

        // Step 5: Collapse whitespace again after accent removal
        result = EXTRA_WHITESPACE.matcher(result).replaceAll(" ").trim();

        return result;
    }

    /**
     * Remove diacritical marks from characters (e.g., á -> a, ế -> e)
     */
    private static String removeAccents(String input) {
        // Use NFD (decomposed form) to separate base characters from diacritical marks
        String nfd = Normalizer.normalize(input, Normalizer.Form.NFD);
        // Pattern to match combining diacritical marks
        Pattern diacriticalPattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return diacriticalPattern.matcher(nfd).replaceAll("");
    }

    /**
     * Check if two addresses are equivalent after normalization
     */
    public static boolean areEquivalent(String address1, String address2) {
        return normalize(address1).equals(normalize(address2));
    }
}
