package br.com.nuvem.doacoes.ong;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OngRepository extends JpaRepository<Ong, Long> {

    @Query("""
            select o from Ong o
            where (:uf is null or o.uf = :uf)
              and (:termo = ''
                   or lower(o.nome) like lower(concat('%', :termo, '%'))
                   or lower(o.cidade) like lower(concat('%', :termo, '%')))
            order by o.nome
            """)
    List<Ong> buscar(@Param("termo") String termo, @Param("uf") String uf);
}
