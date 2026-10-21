package br.com.nuvem.doacoes.comum;

/** Cálculo de distância em linha reta entre dois pontos (fórmula de Haversine). */
public final class Geo {

    private static final double RAIO_TERRA_KM = 6371.0088;

    private Geo() {
    }

    public static double distanciaKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dLng / 2), 2);
        return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(a));
    }

    public static double arredondar(double valor) {
        return Math.round(valor * 10.0) / 10.0;
    }
}
