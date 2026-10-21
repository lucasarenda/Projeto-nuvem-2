package br.com.nuvem.doacoes.doacao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.nuvem.doacoes.doacao.Doacao.Status;

public interface DoacaoRepository extends JpaRepository<Doacao, Long> {

    @Query("""
            select d from Doacao d
              join fetch d.doador dd
              join fetch d.necessidade n
              join fetch n.ong o
            where (:doadorId is null or dd.id = :doadorId)
              and (:ongId is null or o.id = :ongId)
              and (:necessidadeId is null or n.id = :necessidadeId)
              and (:status is null or d.status = :status)
            order by d.criadoEm desc
            """)
    List<Doacao> buscar(@Param("doadorId") Long doadorId,
                        @Param("ongId") Long ongId,
                        @Param("necessidadeId") Long necessidadeId,
                        @Param("status") Status status);
}
