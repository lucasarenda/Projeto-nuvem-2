package br.com.nuvem.doacoes.necessidade;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.nuvem.doacoes.necessidade.Necessidade.Categoria;
import br.com.nuvem.doacoes.necessidade.Necessidade.Status;
import br.com.nuvem.doacoes.necessidade.Necessidade.Urgencia;

public interface NecessidadeRepository extends JpaRepository<Necessidade, Long> {

    @Query("""
            select n from Necessidade n join fetch n.ong o
            where (:ongId is null or o.id = :ongId)
              and (:categoria is null or n.categoria = :categoria)
              and (:urgencia is null or n.urgencia = :urgencia)
              and (:status is null or n.status = :status)
              and (:uf is null or o.uf = :uf)
              and (:termo is null
                   or lower(n.titulo) like lower(concat('%', :termo, '%'))
                   or lower(o.nome) like lower(concat('%', :termo, '%')))
            order by n.criadoEm desc
            """)
    List<Necessidade> buscar(@Param("ongId") Long ongId,
                             @Param("categoria") Categoria categoria,
                             @Param("urgencia") Urgencia urgencia,
                             @Param("status") Status status,
                             @Param("uf") String uf,
                             @Param("termo") String termo);

    /** Candidatas para o "match": necessidades abertas da categoria, com a ONG já carregada. */
    @Query("""
            select n from Necessidade n join fetch n.ong o
            where n.status = :status
              and n.quantidadeRecebida < n.quantidade
              and (:categoria is null or n.categoria = :categoria)
              and (:termo is null
                   or lower(n.titulo) like lower(concat('%', :termo, '%'))
                   or lower(n.descricao) like lower(concat('%', :termo, '%')))
            """)
    List<Necessidade> buscarPorStatus(@Param("status") Status status,
                                      @Param("categoria") Categoria categoria,
                                      @Param("termo") String termo);

    default List<Necessidade> candidatas(Categoria categoria, String termo) {
        return buscarPorStatus(Status.ABERTA, categoria, termo);
    }

    long countByOngIdAndStatus(Long ongId, Status status);

    default long contarAbertasDaOng(Long ongId) {
        return countByOngIdAndStatus(ongId, Status.ABERTA);
    }

    @Query("select n.ong.id, count(n) from Necessidade n where n.status = :status group by n.ong.id")
    List<Object[]> contarPorOng(@Param("status") Status status);

    default Map<Long, Long> contarAbertasPorOng() {
        return contarPorOng(Status.ABERTA).stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
    }
}
